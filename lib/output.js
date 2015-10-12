/**
 * Created by wangxin8 on 2015/10/8.
 */
'use strict';

var fs = require('fs');
var PATH = require('path');

var iconv = require('iconv-lite');
var UglifyJS = require('uglify-js');

var mkdir = require('./mkdir.js');
var trace = require('./trace.js');

function outputHandle(code, basePath, charset, config) {

    var content = iconv.decode(code, charset);
    //代码压缩
    if (config.output && config.output.compress) {
        var minText = UglifyJS.minify(content, {
            fromString: true,
            output: {
                ascii_only: true,
                max_line_len: null
            }
        }).code;
    } else {
        var minText = content;
    }

    //获取到文件内容后就删除过度文件
    fs.unlinkSync(basePath);

    //开始文件输出
    //处理path路径的操作系统兼容性
    var path = PATH.normalize((config.output && config.output.path) || './js/');
    var outputPath = /^.+[\/\\]$/.test(path) ? path : path + PATH.sep;

    var fileName = PATH.basename(basePath, '.bsp.js') + '.js';

    if (config.output.type === 'normal') {
        mkdir.sync(path);
        fs.writeFileSync(path + fileName, minText);
        //trace.ok(path + fileName + ' : has been created');
    } else if (config.output.type === 'deep') {
        var p = PATH.relative(outputPath, basePath).replace(/(\.+[\/\\])*/gi, '');
        var route = PATH.dirname(outputPath + p) + PATH.sep;
        mkdir.sync(route);
        fs.writeFileSync(route + fileName, minText);
        //trace.ok(route + fileName + ' : has been created');
    }
}

module.exports = outputHandle;