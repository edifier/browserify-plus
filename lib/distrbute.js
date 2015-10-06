/**
 * Created by wangxin on 15/10/3.
 */

'use strict';
var fs = require('fs');
var PATH = require('path');
var trace = require('./trace.js');

module.exports = function (opt) {

    var input = opt.inputPath || '';

    if (/^.+\/$/.test(input)) {
        var inputPath = input;
    } else {
        var inputPath = input + '/';
    }

    var that = {};

    var i = 0, fileManipulation = function (fileName, baseDir) {
        var fn = PATH.basename(fileName, '.js');
        var outputDir = PATH.dirname(baseDir) + '/' + fn + '.min.js';

        if (!that[outputDir]) {
            that[outputDir] = baseDir;
        } else {
            i += 1;
            trace.warn('holy shit , duplicate file name : \n' + baseDir + '\n' + that[outputDir] + '\n');
            var newName = fn + '_back_up_' + i + '.js';
            fileManipulation(newName, baseDir);
        }
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