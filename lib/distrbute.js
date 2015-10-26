/**
 * Created by wangxin on 15/10/3.
 * return object: {js:{path:path,......},rjs:{},css:{},image:{}}
 * 目的就是排除重复命名的文件
 */

'use strict';
var fs = require('fs');
var PATH = require('path');

var trace = require('./trace.js');

function each(arr, cb) {
    arr.forEach(function (fileName) {
        cb && cb(fileName);
    });
}

module.exports = function (opt) {

    //fileNameCache:排重的缓存数组
    var that = {}, fileNameCache = {};

    /*
     * 对象赋值操作
     * 出现重复的文件名，给出提示
     */
    var fileManipulation = function (fileName, baseDir, type) {
        var r = type == 'rjs' ? 'js' : type;
        if (!that[type]) that[type] = {};
        if (!fileNameCache[r]) fileNameCache[r] = {};
        if (fileNameCache[r][fileName] && opt[type].output.type === 'normal') {
            trace.warn('holy shit , duplicate file name : \n' + fileNameCache[r][fileName] + '\n' + baseDir);
        }
        fileNameCache[r][fileName] = baseDir;
        that[type][baseDir.replace(new RegExp('(.+)\\.(.+)$'), '$1.bsp.$2')] = baseDir;
    };

    /*
     * 遍历inputpath路径下所有文件
     * 查找要处理的文件,交给fileManipulation方法
     */
    function walk(fileDir) {
        var files = fs.readdirSync(fileDir);
        files.forEach(function (fileName) {
            var baseDir = fileDir + fileName, lstat = fs.lstatSync(baseDir);
            if (lstat.isDirectory()) {
                if (fileName === 'js' && (opt.rjs || opt.js)) {
                    each(fs.readdirSync(baseDir), function (fileName) {
                        if (/^.+_rjs\.js$/.test(fileName)) {
                            fileManipulation(fileName, baseDir + '/' + fileName, 'rjs');
                        } else if (/^.+\.js$/.test(fileName)) {
                            fileManipulation(fileName, baseDir + '/' + fileName, 'js');
                        }
                    });
                } else if (fileName === 'rjs' && opt.rjs) {
                    each(fs.readdirSync(baseDir), function (fileName) {
                        if (/^.+\.js$/.test(fileName)) {
                            fileManipulation(fileName, baseDir + '/' + fileName, 'rjs');
                        }
                    });
                } else if (fileName === 'css' && opt.css) {
                    each(fs.readdirSync(baseDir), function (fileName) {
                        if (/^.+\.css$/.test(fileName)) {
                            fileManipulation(fileName, baseDir + '/' + fileName, 'css');
                        }
                    });
                } else {
                    walk(baseDir + '/');
                }
            } else if (lstat.isFile()) {
                if (/^.+_rjs\.js$/.test(fileName) && opt.rjs) {
                    fileManipulation(fileName, baseDir, 'rjs');
                } else if (/^.+\.js$/.test(fileName) && opt.js) {
                    fileManipulation(fileName, baseDir, 'js');
                } else if (/^.+\.css$/.test(fileName) && opt.css) {
                    fileManipulation(fileName, baseDir, 'css');
                } else if (opt.image && opt.image.patterns.indexOf(PATH.extname(fileName)) != -1) {
                    fileManipulation(fileName, baseDir, 'image');
                }
            }
        });
    };

    walk(opt.inputPath);

    return that;
};