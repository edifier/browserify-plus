/**
 * Created by wangxin8 on 2015/10/8.
 * 文件的输出处理，包括rjs、js、css文件
 */
'use strict';

var fs = require('fs');
var PATH = require('path');

var UglifyJS = require('uglify-js');
var CleanCSS = require('clean-css');

var mkdir = require('./mkdir.js');
var trace = require('./trace.js');

function outputHandle(code, basePath, configure, type) {

    var content = code,
        config = configure[type],
        minText, printOut;

    //压缩处理
    if (type === 'js' || type === 'rjs') {
        //代码压缩
        if (config.output && config.output.compress) {
            minText = UglifyJS.minify(content, {
                fromString: true,
                output: {
                    ascii_only: true,
                    max_line_len: null
                }
            }).code;
        } else {
            minText = content;
        }
    } else if (type === 'css') {
        var cssObj = new CleanCSS({relativeTo: PATH.dirname(basePath)}).minify(content);

        if (cssObj.errors && cssObj.errors.length) trace.warn('error: ' + cssObj.errors[0]);
        minText = cssObj.styles;
    }

    if (config.output && config.output.banner) {
        printOut = config.output.banner.replace(/<%time%>/gi, new Date()) + minText;
    } else {
        printOut = minText;
    }

    //开始文件输出
    var outputpath = PATH.normalize((config.output && config.output.path) || './' + type + '/');

    var fileName = PATH.basename(basePath).replace(/\.bsp/, '');

    if (config.output.type === 'normal') {
        mkdir.sync(outputpath);
        fs.writeFileSync(outputpath + fileName, printOut);
    } else if (config.output.type === 'deep') {
        var p = PATH.relative(outputpath, basePath).replace(/(\.+[\/\\])*/gi, '');
        var route = PATH.dirname(outputpath + p) + PATH.sep;
        mkdir.sync(route);
        fs.writeFileSync(route + fileName, printOut);
    }
}

module.exports = outputHandle;