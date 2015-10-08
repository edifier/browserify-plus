/**
 * Created by wangxin on 15/10/3.
 */

'use strict';
var fs = require('fs');
var PATH = require('path');

module.exports = function (opt) {

    var input = opt.inputPath || '';

    if (/^.+\/$/.test(input)) {
        var inputPath = input;
    } else {
        var inputPath = input + '/';
    }

    var that = {};

    var fileManipulation = function (fileName, baseDir) {
        that[PATH.dirname(baseDir) + '/' + PATH.basename(fileName, '.js') + '.min.js'] = baseDir;
    };

    function walk(fileDir) {
        var files = fs.readdirSync(fileDir);
        files.forEach(function (fileName) {
            var baseDir = fileDir + fileName, lstat = fs.lstatSync(baseDir);
            if (lstat.isDirectory()) {
                if (fileName === 'js') {
                    var files = fs.readdirSync(baseDir);
                    files.forEach(function (fileName) {
                        //对rjs文件的处理
                        if (/^.+_rjs\.js$/.test(fileName)) {
                            fileManipulation(fileName, baseDir + '/' + fileName);
                        }
                    });
                } else if (fileName === 'rjs') {
                    var files = fs.readdirSync(baseDir);
                    files.forEach(function (fileName) {
                        //对rjs文件的处理
                        if (/^.+\.js$/.test(fileName)) {
                            fileManipulation(fileName, baseDir + '/' + fileName);
                        }
                    });
                } else {
                    walk(baseDir + '/');
                }
            } else if (lstat.isFile()) {
                //对rjs文件的处理
                if (/^.+_rjs\.js$/.test(fileName)) {
                    fileManipulation(fileName, baseDir);
                }
            }
        });
    };

    walk(inputPath);

    return that;
};