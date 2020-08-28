const PROTO_PATH = "./zbprotocol.proto";

const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const {PaginationHandler, dataPairsToMap} = require("./pagination")

var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true
});

var protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

var zbprotocol = protoDescriptor.zbprotocol;

class ZetabaseClient {
    constructor(){
        this.url = 'api.zetabase.io:443';
        this.uid = undefined;
        this.parentUid = undefined;
    }

    connectRootWithPassword(handle, pass) {
        this.handle = handle;
        this.pass = pass;
        this.client = new zbprotocol.ZetabaseProvider(this.url, grpc.credentials.createSsl());
        let reqDat = {handle: handle, password: pass};
        let self = this;
        return new Promise((resolv, reject) => {
            self.client.LoginUser(reqDat, function(err,res){
                if(err){
                    reject(err)
                } else {
                    self.uid = res.id;
                    self.jwtToken = res.jwtToken;
                    self.handle = handle;
                    self.passwordUsed = pass;
                    resolv(res)
                }
            })
        })
    }

    authenticated() {
        return (!!this.jwtToken);
    }

    checkReady() {
        if((!this.uid) || (!this.client) || (!this.authenticated())) {
            return false;
        }
        return true; 
    }

    getNonce(){
        return (new Date()).getTime() * 1000;
    }

    getAuth(nonce, xb) {
        if(!!this.jwtToken) {
            return {credType: "JWT_TOKEN", jwtToken: this.jwtToken}
        }
        return undefined;
    }

    listKeys(table, patternOpt) {
        let self = this;
        let getFn = (async (pgIdx) => {
            return self.listKeysPage(table, patternOpt, pgIdx)
        });
        return new PaginationHandler(getFn);
    }

    listKeysPage(table, patternOpt, pageIndexOpt) {
        let owner = this.parentUid ?? this.uid;
        let nonce = this.getNonce()
        let auth = this.getAuth(nonce, "")
        let page = pageIndexOpt ?? 0;
        let pat = patternOpt ?? "";

        return new Promise((resolv,reject) => {
            this.client.ListKeys({id: this.uid, tableId: table, tableOwnerId: owner, credential: auth, nonce: nonce, pageIndex: page, pattern: pat}, function(err,res) {
                if(err){
                    // console.log('err ', err)
                    reject(err)
                } else {
                    resolv({data: res.keys, hasNext: res.pagination.hasNextPage, nextPage: res.pagination.nextPageIndex, pagination: res.pagination})
                }
            })
        })
    }


    async listTables() {
        let owner = this.parentUid ?? this.uid;
        let nonce = this.getNonce()
        let auth = this.getAuth(nonce, "")
        let req = {id: this.uid, tableOwnerId:owner, nonce:nonce, credential:auth};
        // console.log(req) 
        return new Promise((resolve, reject) => {
            return this.client.listTables(req, (err, res) => {
                if (!!err) {
                    reject(err)
                } else {
                    resolve(res)
                }
            })
        })
    }
    
    putMulti(table, keys, values) {
        if (keys.length != values.length) {
            throw new Error('ImproperDimensions')
        }
        
        let owner = this.parentUid ?? this.uid;
        let nonce = this.getNonce()
        let auth = this.getAuth(nonce, "")

        
        let dps = []
        var i
        for (i = 0; i < keys.length; i++) {
            let value = values[i]
            if(typeof(value) == "string") {
                value = new TextEncoder("utf-8").encode(value)
            } 
            dps.push({key: keys[i], value: value})
        }
        
        let req = {id: this.uid, tableOwnerId: owner, tableId: table, overwrite: false, nonce: nonce, credential: auth, pairs: dps} 
    
        return new Promise((resolve, reject) => {
            return this.client.PutDataMulti(req, (err, res) => {
                if (!!err) {
                    reject(err)
                } else {
                    resolve(true);
                }
            })
        })
    }

    put(table, key, valu, doOverwriteOpt) {
        let owner = this.parentUid ?? this.uid;
        let nonce = this.getNonce()
        let auth = this.getAuth(nonce, "")
        let ovr = doOverwriteOpt;
        let v = undefined;
        if(typeof(valu) == 'string') {
            v = Buffer.from(valu);
        } else {
            v = valu;
        }
        let req = {id: this.uid,tableOwnerId: owner, tableId: table, key: key, value: v, overwrite: ovr, nonce: nonce, credential: auth};
        return new Promise((resolv, reject) => {
            this.client.PutData(req, function(err,res){
                if(err){
                    reject(err)
                } else {
                    resolv(res)
                }
            })
        })
    }

    getKey(table, key, asTypeOpt) {
        let owner = this.parentUid ? (!!this.parentUid) : this.uid;
        let returnJson = (!!asTypeOpt) ? (asTypeOpt.toLowerCase() == "json") : false;
        let nonce = this.getNonce()
        let auth = this.getAuth(nonce, "")
        return new Promise((resolv, reject) => {
            this.client.GetData({id: this.uid, tableId: table, tableOwnerId: owner, credential: auth, nonce: nonce, pageIndex: 0, keys: [key]}, function(err,res){
                if(err){
                    reject(err)
                } else {
                    if(!res.data[0].value) {
                        resolv(undefined)
                    } else if(!returnJson){
                        resolv(res.data[0])
                    } else {
                        resolv(JSON.parse(res.data[0].value))
                    }
                }
            })
        })
    }

    deleteKey(table, key) {
        let nonce = this.getNonce()
        let owner = this.parentUid ? (!!this.parentUid) : this.uid;
        let poc = this.getAuth(nonce, "")
        let req = {nonce: nonce, tableOwnerId: owner, tableId: table, objectId: key, objectType: "KEY", credential: poc, id: this.uid} 

        return new Promise((resolve, reject) => {
            return this.client.DeleteObject(req, (err, res) => {
                if (!!err) {
                    reject(err)
                } else {
                    resolve(res)
                }
            })
        })
    }

    getKeys(table, keys, asTypeOpt) {
        let self = this;
        let getFn = (async (pgIdx) => {
            return self.getKeysPage(table, keys, asTypeOpt, pgIdx)
        });
        return new PaginationHandler(getFn);
    }
    
    getKeysPage(table, keys, asTypeOpt, pageIndexOpt) {
        let owner = this.parentUid ? (!!this.parentUid) : this.uid;
        let returnJson = (!!asTypeOpt) ? (asTypeOpt.toLowerCase() == "json") : false;
        let nonce = this.getNonce()
        let auth = this.getAuth(nonce, "")
        let page = pageIndexOpt;
        return new Promise((resolv, reject) => {
            this.client.GetData({id: this.uid, tableId: table, tableOwnerId: owner, credential: auth, nonce: nonce, pageIndex: page, keys: keys}, function(err,res){
                if(err){
                    reject(err)
                } else {
                    // console.log("res: ", res)
                    let hasNext = res.pagination.hasNextPage;
                    let nextPage = res.pagination.nextPageIndex;
                    if(!returnJson){
                        // resolv(res.data)
                        resolv({data: dataPairsToMap(res.data), hasNext: hasNext, nextPage: nextPage});
                    } else {
                        let kvPairs = res.data.map((x) => {
                            if(x.value){
                                return {key: x.key, value: JSON.parse(x.value)}
                            }
                            return x;
                        })
                        // resolv(kvPairs)
                        resolv({data: dataPairsToMap(kvPairs), hasNext: hasNext, nextPage: nextPage});
                    }
                }
            })
        })
    }

    queryDataPage(table, query, asTypeOpt, pageIndexOpt) {
        let owner = this.parentUid ? (!!this.parentUid) : this.uid;
        let returnJson = (!!asTypeOpt) ? (asTypeOpt.toLowerCase() == "json") : false;
        let nonce = this.getNonce()
        let auth = this.getAuth(nonce, "")
        let page = pageIndexOpt ?? 0;
        let req = {id: this.uid, tableId: table, tableOwnerId: owner, credential: auth, nonce: nonce, pageIndex: page, query: query.toSubQuery()};
        // console.log(req)
        return new Promise((resolv, reject) => {
            this.client.QueryData(req, function(err,res){
                if(err){
                    // console.log(err)
                    reject(err)
                } else {
                    // console.log(res)
                    let hasNext = res.pagination.hasNextPage;
                    let nextPage = res.pagination.nextPageIndex;
                    if(!returnJson){
                        // resolv(res.data)
                        resolv({data: dataPairsToMap(res.data), hasNext: hasNext, nextPage: nextPage});
                    } else {
                        let kvPairs = res.data.map((x) => {
                            if(x.value){
                                return {key: x.key, value: JSON.parse(x.value)}
                            }
                            return x;
                        })
                        // resolv(kvPairs)
                        resolv({data: dataPairsToMap(kvPairs), hasNext: hasNext, nextPage: nextPage});
                    }
                }
            })
        })
    }
    queryKeysPage(table, query, pageIndexOpt) {
        let owner = this.parentUid ? (!!this.parentUid) : this.uid;
        let nonce = this.getNonce()
        let auth = this.getAuth(nonce, "")
        let page = pageIndexOpt ?? 0;
        let req = {id: this.uid, tableId: table, tableOwnerId: owner, credential: auth, nonce: nonce, pageIndex: page, query: query.toSubQuery()};
        // console.log(req)
        return new Promise((resolv, reject) => {
            this.client.QueryKeys(req, function(err,res){
                if(err){
                    // console.log(err)
                    reject(err)
                } else {
                    // console.log(res)
                    let hasNext = res.pagination.hasNextPage;
                    let nextPage = res.pagination.nextPageIndex;
                    resolv({data: res.keys, hasNext: hasNext, nextPage: nextPage});
                }
            })
        })
    }

    query(table, query, asTypeOpt) {
        let self = this;
        let getFn = (async (pgIdx) => {
            return self.queryDataPage(table, query, asTypeOpt, pgIdx)
        });
        return new PaginationHandler(getFn);
    }


    queryKeys(table, query) {
        let self = this;
        let getFn = (async (pgIdx) => {
            return self.queryKeysPage(table, query, pgIdx)
        });
        return new PaginationHandler(getFn);
    }

    toString(){
        return `ZB client for ${this.handle}`
    }
}

exports.ZetabaseClient = ZetabaseClient;