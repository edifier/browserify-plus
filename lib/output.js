/**
 * Created by wangxin8 on 2015/10/8.
 */
'use strict';

var fs = require('fs');
var PATH = require('path');
var iconv = require('iconv-lite');
var mkdir = require('./mkdir.js');
var UglifyJS = require('uglify-js');

function outputHandle(code, outputPath, charset, config, lineation) {
    var that = {}, i = 0;

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
    fs.unlinkSync(outputPath);
    //代码输出
    var path = config.output.path ? config.output.path : './js/';
    var fileName = PATH.basename(outputPath, '.min.js') + '.js';
    if (config.output.type === 'normal') {
        //i += 1;
        //trace.warn('holy shit , duplicate file name : \n' + baseDir + '\n' + that[outputDir] + '\n');
        //var newName = fn + '_back_up_' + i + '.js';
        //fileManipulation(newName, baseDir);

        mkdir(path, function () {
            fs.writeFileSync(path + fileName, minText);
        });
    } else if (config.output.type === 'deep') {
        var route = PATH.dirname(PATH.resolve(path, outputPath)) + lineation;
        mkdir(route, function () {
            fs.writeFileSync(route + fileName, minText);
        });
    }
}

module.exports = outputHandle;