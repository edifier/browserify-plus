/**
 * @fileoverview es6 Promise的简单实现
 * @author creep creep.wei@gmail.com
 * @version 0.1
 * api说明 http://t.cn/8F5QRAc
 */

var PENDING = 'pending',
    RESOLVED = 'resolved',
    REJECTED = 'rejected',
    ERROR_CODE = -10000;

var isType = function ( type ) {
    return function ( obj ) {
        return {}.toString.call( obj ) == '[object ' + type + ']';
    }
};

var isObject = isType( 'Object' );
var isFunction = isType( 'Function' );
var isArray = Array.isArray || isType( 'Array' );

function isPromise (p) {
    return isObject(p) && isFunction(p.then);
}


function Promise(fn) {

    this.__status = PENDING;
    this.__resolveList = [];
    this.__rejectList = [];

    var self = this;

    function resolve (value) {
        if ( self.__status == PENDING ) {
            self.__status = RESOLVED;
            self.__value = value;
            var list = self.__resolveList,
                cb;
            while ( cb = list.shift() ) {
                cb(value);
            }
        }
    }

    function reject (value) {
        if ( self.__status == PENDING ) {
            self.__status = REJECTED;
            self.__value = value;
            var list = self.__rejectList,
                cb;
            while ( cb = list.shift() ) {
                cb(value);
            }
        }
    }

    fn(resolve, reject);
}

Promise.prototype.then = function (resolveCallback, rejectCallback) {

    var self = this;

    return new Promise(function (resolve, reject) {

        var resolveCallbackWrap = function (value) {

            try {
                var ret = resolveCallback ? resolveCallback(value) : value;
            } catch (e) {
                if ( !(e instanceof Error) ) {
                    e = new Error(e);
                }
                e._code = ERROR_CODE; //使用code简单标记，不再包装特定异常类型
                reject(e);
                //reject(new Error(e));
                return;
            }

            if ( isPromise(ret) ) {
                ret.then(function (value) {
                    resolve(value);
                });
            } else {
                resolve(ret);
            }
        };

        var rejectCallbackWrap = function (value) {
            if ( value instanceof Error && !rejectCallback ) { //冒泡异常
                reject(value);
            } else {
                try {
                    var ret = rejectCallback ? rejectCallback(value) : value;
                } catch (e) {
                    if ( !(e instanceof Error) ) {
                        e = new Error(e);
                    }
                    e._code = ERROR_CODE;
                    reject(e);
                    //reject(new Error(e));
                    return;
                }
                resolve();
            }
        };

        if ( self.__status == RESOLVED ) {
            resolveCallbackWrap(self.__value);
        } else if ( self.__status == REJECTED ) {
            rejectCallbackWrap(self.__value);
        } else {
            self.__resolveList.push(resolveCallbackWrap);
            self.__rejectList.push(rejectCallbackWrap);
        }
    });
};

Promise.prototype.catch = function (rejectCallback) {

    var self = this;
    return new Promise(function (resolve, reject) {

        var rejectCallbackWrap = function (value) {
            if ( value instanceof Error && value._code == ERROR_CODE ) { //catch只处理异常情况
                var ret = rejectCallback ? rejectCallback(value) : value;
                resolve(ret);
            } else {
                resolve(self.__value);
            }
        };

        if ( self.__status == RESOLVED ) {
            resolve(self.__value);
        } else if ( self.__status == REJECTED ) {
            rejectCallbackWrap(self.__value);
        } else {
            self.__resolveList.push(resolve);
            self.__rejectList.push(rejectCallbackWrap);
        }
    });
};

Promise.resolve = function (p) {

    if ( isPromise(p) ) {
        //return p;
        return new Promise(function (resolve, reject) {
            p.then(resolve, reject);
        });
    }

    return new Promise(function (resolve) {
        resolve(p);
    });
};

Promise.reject = function (p) {
    if ( isPromise(p) ) {
        //return p;
        return new Promise(function (resolve, reject) {
            p.then(resolve, reject);
        });
    }

    return new Promise(function (resolve, reject) {
        reject(p);
    });
};

Promise.all = function (ps) {

    if ( !isArray(ps) ) {
        throw 'arguments must be an array in Promise.all';
    }

    return new Promise(function (resolve, reject) {
        var i = 0,
            len = ps.length,
            count = 0,
            rets = [],
            p;

        for ( ; i < len; i++ ) {

            p = ps[i];

            if ( !isPromise(p) ) {
                p = Promise.resolve(p);
            }

            (function (i) {
                p.then(function (value) {
                    rets[i] = value;
                    count += 1;
                    if ( count == len ) {
                        resolve(rets);
                    }
                }, reject);
            })(i);
        }
    });
};

Promise.race = function (ps) {

    if ( !isArray(ps) ) {
        throw 'arguments must be an array in Promise.race';
    }

    return new Promise(function (resolve, reject) {
        var i = 0,
            len = ps.length,
            p;

        for ( ; i < len; i++ ) {
            p = ps[i];

            if ( !isPromise(p) ) {
                p = Promise.resolve(p);
            }

            p.then(resolve, reject);
        }
    });
};

if ( typeof window != 'undefined' && window.Promise ) {
    module.exports = window.Promise;
} if ( typeof global != 'undefined' && global.Promise ) {
    module.exports = global.Promise;
} else {
    module.exports = Promise;
}

//for test
//module.exports = Promise;
