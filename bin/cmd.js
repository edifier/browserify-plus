#!/usr/bin/env node

/*
 * Created by wangxin on 15/10/10.
 */

'use strict';
var fs = require('fs');
var PATH = require('path');
var browserifyPlus = require('../index');
var trace = require('../lib/trace');

function forEach(handle) {
    var arr = this, len = arr.length;
    for (var i = 0; i < len; i++) {
        if (handle(arr[i], i) === false) break;
    }
}

function getFilePath(filePath, file, that) {
    forEach.call(fs.readdirSync(filePath), function (fileName) {
        var baseDir = filePath + fileName;
        try {
            var lstat = fs.lstatSync(baseDir);
        } catch (e) {
            trace.error('Skip a file parsing error.');
            //process.exit(1);
            return;
        }
        if (lstat.isDirectory()) {
            if (PATH.basename(baseDir).replace(/\..+$/, '') == '')return;
            getFilePath(baseDir + PATH.sep, file, that);
        } else if (lstat.isFile() && fileName === file) {
            that.path = baseDir;
            return false;
        }
    });
    return that;
}

function relativePath(basePath, outPath) {
    var symbol = PATH.sep, dirArr = outPath.split(symbol), $p;
    switch (dirArr[0]) {
        case '.':
            $p = PATH.join(basePath, outPath);
            break;
        case '' :
            $p = outPath;
            break;
        case '..':
            var baseArr = basePath.split(symbol);
            forEach.call(dirArr, function (dir, i) {
                if (dir === '..') {
                    baseArr.pop();
                } else {
                    $p = PATH.join(baseArr.join(symbol), dirArr.slice(i).join(symbol));
                    return false;
                }
            });
            break;
        default :
            $p = PATH.join(basePath, outPath);
    }
    return $p;
}

function extendDeep(parent,child,dirName) {
    var i,
        toStr = Object.prototype.toString,
        astr = '[object Array]';
    for (i in parent) {
        if (parent.hasOwnProperty(i)) {
            if (typeof parent[i] === "object") {
                child[i] = (toStr.call(parent[i]) === astr) ? [] : {};
                extendDeep(parent[i], child[i],dirName);
            } else {
                if (/path/gi.test(i) ) parent[i] = relativePath(dirName, parent[i]);
                child[i] = parent[i];
            }
        }
    }
    return child;
}

var args = process.argv[2] ? process.argv[2].replace(/^\-/, '') : '';

if (/(v|version)/i.test(args)) {
    return trace.log(require('../package.json').version);
}

if (args && !/.+\.bsp\.js$/.test(args)) {
    return trace.warn('configuration file named *.bsp.js');
}

var fileMap = args ? {path: relativePath(process.cwd(), args)} : getFilePath(process.cwd() + PATH.sep, 'config.bsp.js', {});


if (fileMap && fileMap.path) {
    try {
        var config = require(fileMap.path), dirName = PATH.dirname(fileMap.path);
    } catch (e) {
        trace.error('configuration file parsing error');
        process.exit(1);
    }

    browserifyPlus(extendDeep(config,{},dirName));
} else {
    return trace.error('no configuration file, please edit it');
}
