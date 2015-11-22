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
        output, minText, printOut;

    //压缩处理
    if (type === 'js' || type === 'rjs') {
        //代码压缩
        if (config.output && config.output.compress) {

            //js文件压缩的输出配置
            output = UglifyJS.OutputStream({
                ascii_only: true,
                max_line_len: null
            });

            //性能优化，替换之前的压缩方式
            UglifyJS.parse(content, {
                filename: basePath
            }).print(output);

            //获取文件内容
            minText = output.get();
        } else {
            minText = content;
        }
    } else if (type === 'css') {
        var cssObj = new CleanCSS({
            relativeTo: PATH.dirname(basePath),
            report: 'min'
        }).minify(content);

        if (cssObj.errors && cssObj.errors.length) trace.warn('error: ' + cssObj.errors[0]);
        minText = cssObj.styles;
    }

    if (config.output && config.output.banner) {
        printOut = config.output.banner.replace(/<%time%>/gi, new Date()) + minText;
    } else {
        printOut = minText;
    }

    minText = null;

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

    printOut = null;
}

module.exports = outputHandle;