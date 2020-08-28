





function opCodeToQueryOperator(opCode) {
    let op = opCode.toLowerCase();
    switch(op) {
        case "=", "eq":
            return "EQUALS";
        case "!=", "not", "neq":
            return "NOT_EQUALS";
        case ">=", "gte":
            return "GREATER_THAN_EQ";
        case ">", "gt":
            return "GREATER_THAN";
        case "<=", "lte":
            return "LESS_THAN_EQ";
        case "<", "lt":
            return "LESS_THAN";
        case "~", "search":
            return "TEXT_SEARCH";
        default:
            throw `no such operator: ${op}`
    }
}

function queryObjectTypify(obj) {
    let t = typeof(obj).toString().toLowerCase();
    switch(t) {
        case "number":
            return "REAL_NUMBERS";
        default:
            return "LEXICOGRAPHIC";
    }
}

function stringToLogical(s0) {
    let s = s0.toLowerCase();
    switch(s) {
        case "&&", "&", "and":
            return "LOGICAL_AND";
        default:
            return "LOGICAL_OR";
    }
}

export class QComparison {
    constructor(opCode, field, valu) {
        this.opCode = opCode;
        this.field = field;
        this.valu = valu;
    }

    toProtocol() {
        let op = opCodeToQueryOperator(this.opCode);
        let typToUse = queryObjectTypify(this.valu);
        if(op == "TEXT_SEARCH") {
            typToUse = "FULL_TEXT";
        }
        let comparison = {op: op, field: this.field, value: this.valu, ordering: typToUse} 
        let subq = {isCompound: false, comparison: comparison};
        return subq;
    }
}

export function QCompare(opCode, field, valu) {
    return new QComparison(opCode, field, valu)
}

export class QLogicalOp {
    constructor(opCode, q1, q2) {
        this.opCode = opCode;
        this.left = q1;
        this.right = q2;
    }

    toProtocol() {
        let operator = stringToLogical(this.opCode);
        let subq = {isCompound: true, compoundOperator: operator, compoundLeft: this.left, compoundRight: this.right};
        return subq;
    }
}

export function QLogical(opCode, leg1, leg2) {
    return new QLogicalOp(opCode, leg1, leg2)
}
