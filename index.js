/**
 * Created by wangxin on 15/10/3.
 */

'use strict';
var handle = require('./lib/main.js');

Object.prototype.extendDeep = function (parent) {
    var i,
        toStr = Object.prototype.toString,
        astr = "[object Array]",
        child = this || {};
    for (i in parent) {
        if (parent.hasOwnProperty(i)) {
            if (typeof parent[i] === "object") {
                child[i] = (toStr.call(parent[i]) === astr) ? [] : {};
                extendDeep(parent[i], child[i]);
            } else {
                parent[i] && (child[i] = parent[i]);
            }
        }
    }
    return child;
};

Object.prototype.getLength = function () {
    var i = 0, o = this;
    for (var j in o) (o.hasOwnProperty(j) && o[j]) && i++;
    return i;
};

handle(extendDeep.call({
    inputPath: './test/src',
    output: {
        path: './js/',
        type: 'normal',   //normal、deep
        compress:false
    },
    libraryPath: './core/'
}, {}));