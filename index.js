const PROTO_PATH = "./zbprotocol.proto";

var grpc = require("grpc");
var protoLoader = require("@grpc/proto-loader");

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
    }

    connectRootWithPassword(handle, pass) {
        this.handle = handle;
        this.pass = pass;
        this.client = new zbprotocol.ZetabaseProvider(this.url, grpc.credentials.createSsl());
        let reqDat = {handle: handle, password: pass};
        return new Promise((resolv, reject) => {
            this.client.LoginUser(reqDat, function(err,res){
                if(err){
                    console.log(`err: ${JSON.stringify(err)}`)
                    reject(err)
                } else {
                    console.log(`Result: ${JSON.stringify(res)}`)
                    resolv(res)
                }
            })
        })
    }

    toString(){
        return `ZB client for ${this.handle}`
    }
}

exports.ZetabaseClient = ZetabaseClient;