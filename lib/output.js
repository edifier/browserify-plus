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

function outputHandle(code, basePath, charset, config, lineation) {


    function printOff(fileName, path, minText) {
        fs.exists(path + fileName, function (exists) {
            if (!exists) {
                mkdir.sync(path);
                fs.writeFileSync(path + fileName, minText);
            } else {
                i += 1;
                trace.warn('holy shit , duplicate file name : ' + fileName);
                var newName = PATH.basename(fileName, '.js') + '_back_up_' + i + '.js';
                printOff(newName, path);
            }

        });
    }

    var i = 0, content = iconv.decode(code, charset);
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
    var path = PATH.normalize(config.output.path ? config.output.path : './js/');
    var outputPath = /^.+[\/\\]$/.test(path) ? path : path + lineation;

    var fileName = PATH.basename(basePath, '.min.js') + '.js';

    if (config.output.type === 'normal') {
        printOff(fileName, outputPath, minText);
    } else if (config.output.type === 'deep') {
        var p = PATH.relative(outputPath, basePath).replace(/(\.+[\/\\])*/gi, '');
        var route = PATH.dirname(outputPath + p) + lineation;
        mkdir.sync(route);
        fs.writeFileSync(route + fileName, minText);
    }
}

module.exports = outputHandle;