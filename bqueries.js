
class QAnd {
    constructor(left, right) {
        this.left = left 
        this.right = right 
    }

    toSubQuery() {
        return {isCompound: true, compoundOperator: "LOGICAL_AND", compoundLeft: this.left.toSubQuery(), compoundRight: this.right.toSubQuery()}
    }
}

class QOr {
    constructor(left, right) {
        this.left = left 
        this.right = right 
    }

    toSubQuery() {
        return {isCompound: true, compoundOperator: "LOGICAL_OR", compoundLeft: this.left.toSubQuery(), compoundRight: this.right.toSubQuery()}
    }
}

class QEq {
    constructor(field, compValue) {
        this.field = field 
        this.compValue = compValue
    }

    toSubQuery() {
        let valueStr = this.compValue.toString()
        let qOrder = queryObjectTypify(this.compValue)
        return {comparison: {op: "EQUALS", field: this.field, value: valueStr, ordering: qOrder}, isCompound: false}
    }   
}

class QNe {
    constructor(field, compValue) {
        this.field = field 
        this.compValue = compValue
    }

    toSubQuery() {
        let valueStr = this.compValue.toString()
        let qOrder = queryObjectTypify(this.compValue)
        return {comparison: {op: "NOT_EQUALS", field: this.field, value: valueStr, ordering: qOrder}, isCompound: false}
    }   
}

class QGt {
    constructor(field, compValue) {
        this.field = field 
        this.compValue = compValue
    }

    toSubQuery() {
        let valueStr = this.compValue.toString()
        let qOrder = queryObjectTypify(this.compValue)
        return {comparison: {op: "GREATER_THAN", field: this.field, value: valueStr, ordering: qOrder}, isCompound: false}
    }   
}

class QGe {
    constructor(field, compValue) {
        this.field = field 
        this.compValue = compValue
    }

    toSubQuery() {
        let valueStr = this.compValue.toString()
        let qOrder = queryObjectTypify(this.compValue)
        return {comparison: {op: "GREATER_THAN_EQ", field: this.field, value: valueStr, ordering: qOrder}, isCompound: false}
    }   
}

class QLt {
    constructor(field, compValue) {
        this.field = field 
        this.compValue = compValue
    }

    toSubQuery() {
        let valueStr = this.compValue.toString()
        let qOrder = queryObjectTypify(this.compValue)
        return {comparison: {op: "LESS_THAN", field: this.field, value: valueStr, ordering: qOrder}, isCompound: false}
    }   
}

class QLe {
    constructor(field, compValue) {
        this.field = field 
        this.compValue = compValue
    }

    toSubQuery() {
        let valueStr = this.compValue.toString()
        let qOrder = queryObjectTypify(this.compValue)
        return {comparison: {op: "LESS_THAN_EQ", field: this.field, value: valueStr, ordering: qOrder}, isCompound: false}
    }   
}

class QTs {
    constructor(field, compValue) {
        this.field = field 
        this.compValue = compValue
    }

    toSubQuery() {
        let valueStr = this.compValue.toString()
        let qOrder = QueryOrdering.FULL_TEXT
        return {comparison: {op: "TEXT_SEARCH", field: this.field, value: valueStr, ordering: qOrder}, isCompound: false}
    }   
}

let qAnd = (left, right) => new QAnd(left, right) 
let qOr = (left, right) => new QOr(left, right) 
let qEq = (field, compValue) => new QEq(field, compValue) 
let qNe = (field, compValue) => new QNe(field, compValue) 
let qGt = (field, compValue) => new QGt(field, compValue) 
let qGe = (field, compValue) => new QGe(field, compValue) 
let qLt = (field, compValue) => new QLt(field, compValue) 
let qLe = (field, compValue) => new QLe(field, compValue) 
let qTs = (field, compValue) => new QTs(field, compValue)

let queryObjectTypify = (value) => {
    let qOrder = "LEXICOGRAPHIC"
    if (typeof(value) == Number) {
        qOrder = "REAL_NUMBERS"
    }
    return qOrder
}

module.exports.qAnd = qAnd;
module.exports.qOr = qOr;
module.exports.qEq = qEq;
module.exports.qNe = qNe;
module.exports.qGt = qGt;
module.exports.qGe = qGe;
module.exports.qLt = qLt;
module.exports.qLe = qLe;
module.exports.qTs = qTs;