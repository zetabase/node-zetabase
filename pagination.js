
function dataPairsToMap(dps) {
    console.log(dps)
    let res = {};
    for(let i = 0; i < dps.length; i++) {
        // let valu = new TextDecoder("utf-8").decode(dps[i].getValue_asU8())
        // res[dps[i].getKey()] = valu;
        res[dps[i].key] = dps[i].value;
    }
    return res;
}

function isArray(o) {
    return typeof(o) == "object" && (!!o.length)
}

class PaginationHandler {
    constructor(getFunction) {
        this.getFn = getFunction;
        this.keys = [];
        this.data = {};
        this.currentPage = -1;
        this.hasNextPage = true;
    }

    next() {
        // console.log(`next on page ${this.currentPage}`)
        return this.getFn(this.currentPage+1).then((res) => {
            // console.log(`data on page ${this.currentPage} - ${res}`)
            this.currentPage += 1;
            this.hasNextPage = res.hasNext;
            if(isArray(res.data)) {
                for(let i = 0; i < res.data.length; i++) {
                    this.keys.push(res.data[i]);
                }
                return res.data;
            } else {
                for(let k in res.data) {
                    this.data[k] = res.data[k];
                }
                return res.data;
            }
        }).catch((e) => {
            this.hasNextPage = false;
            // console.log(`ph error: ${e}`)
            return [];
        });
    }

    data() {
        return this.data;
    }

    keys() {
        return this.keys;
    }

    all() {
        return new Promise(async (resolve, reject) => {
            while (this.hasNextPage) {
                // console.log(`iter..`)
                await this.next();
            }
            if(this.keys.length > 0) {
                resolve(this.keys);
            } else {
                resolve(this.data);
            }
        })
    }
}

module.exports.PaginationHandler = PaginationHandler;
module.exports.dataPairsToMap = dataPairsToMap;