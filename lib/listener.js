/**
 * Created by wangxin8 on 2015/10/21.
 */

'use strict';
var fs = require('fs');
var PATH = require('path');
var watch = require('watch');

var trace = require('./trace.js');

function rule(file) {
    if (PATH.extname(file) === '.js') {
        var fileName = PATH.basename(file);
        //windows的路径格式按unix处理
        var f = file.replace(/\\/gi, '/');
        //忽略掉所用文件名为*.bsp.js的修改
        if (/.*\.bsp\.js/gi.test(fileName)) {
            return false;
        } else if (/.+\/rjs\/.*\.js/gi.test(f) || /.+_rjs\.js/gi.test(fileName)) {
            return true;
        } else {
            return false;
        }
    } else if (PATH.extname(file) === '') {
        return true;
    } else {
        return false;
    }
}

function listener(opts, cb) {
    watch.watchTree(opts.inputPath, {
        filter: rule,
        interval: opts.watch.interval || 1200
    }, function (file, curr, pre) {
        if (typeof file == "object" && pre === null && curr === null) {
            trace.ok('browserify-plus watch task has been started...\n');
        } else if (pre === null) {
            if (!(fs.lstatSync(file).isDirectory())) {
                var o = {};
                o[PATH.dirname(file) + PATH.sep + PATH.basename(file, '.js') + '.bsp.js'] = file;
                cb && cb(o);
                trace.log(file + ' : has been built');
            }
        } else if (curr.nlink === 0) {
            if (PATH.extname(file) === '') return false;
            //var p = PATH.resolve(opts.output.path) + PATH.sep + file;
            //normal模式下，同时将压缩文件删除
            //opts.output.type === 'normal' && fs.unlinkSync(p);
            trace.log(file + ' : has been removed');
        } else {
            var o = {};
            o[PATH.dirname(file) + PATH.sep + PATH.basename(file, '.js') + '.bsp.js'] = file;
            cb && cb(o);
            trace.log(file + ' : has been changed at :' + new Date());
        }
    });
}

module.exports = listener;
