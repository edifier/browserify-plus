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
                child[i].extendDeep(parent[i]);
            } else {
                child[i] = parent[i];
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

module.exports = function () {

    var config = extendDeep.call({
        //需要编译的文件夹
        inputPath: '',
        output: {
            //输出文件路径
            path: '',
            //输出方式: normal、deep
            type: '',
            //是否压缩
            compress: true
        },
        //引用的库文件路径
        libraryPath: './core/'
    }, arguments[0]);

    handle(config);
};