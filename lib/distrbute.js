/**
 * Created by wangxin on 15/10/3.
 */

'use strict';
var fs = require('fs');

var trace = require('./trace.js');

function each(arr, cb) {
    arr.forEach(function (fileName) {
        cb && cb(fileName);
    });
}

module.exports = function (opt) {

    //fileNameCache:排重的缓存数组
    var that = {}, fileNameCache = {};

    var fileManipulation = function (fileName, baseDir, type) {
        if (!that[type]) that[type] = {};
        if (!fileNameCache[type]) fileNameCache[type] = {};
        if (fileNameCache[type][fileName] && opt[type].output.type === 'normal') {
            trace.warn('holy shit , duplicate file name : \n' + fileNameCache[type][fileName] + '\n' + baseDir);
        }
        fileNameCache[type][fileName] = baseDir;
        var r = type == 'rjs' ? 'js' : type;
        that[type][baseDir.replace(new RegExp('(.+)\\.' + r + '$'), '$1.bsp' + '.' + r)] = baseDir;
    };

    function walk(fileDir) {
        var files = fs.readdirSync(fileDir);
        files.forEach(function (fileName) {
            var baseDir = fileDir + fileName, lstat = fs.lstatSync(baseDir);
            if (lstat.isDirectory()) {
                if (fileName === 'js') {
                    each(fs.readdirSync(baseDir), function (fileName) {
                        if (/^.+_rjs\.js$/.test(fileName)) {
                            fileManipulation(fileName, baseDir + '/' + fileName, 'rjs');
                        }
                    });
                } else if (fileName === 'rjs') {
                    each(fs.readdirSync(baseDir), function (fileName) {
                        if (/^.+\.js$/.test(fileName)) {
                            fileManipulation(fileName, baseDir + '/' + fileName, 'rjs');
                        }
                    });
                } else if (fileName === 'css') {
                    each(fs.readdirSync(baseDir), function (fileName) {
                        if (/^.+\.css$/.test(fileName)) {
                            fileManipulation(fileName, baseDir + '/' + fileName, 'css');
                        }
                    });
                } else {
                    walk(baseDir + '/');
                }
            } else if (lstat.isFile()) {
                if (/^.+_rjs\.js$/.test(fileName)) {
                    fileManipulation(fileName, baseDir, 'rjs');
                } else if (/^.+\.css$/.test(fileName)) {
                    fileManipulation(fileName, baseDir, 'css');
                }
            }
        });
    };

    walk(opt.inputPath);

    return that;
};