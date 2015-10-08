/**
 * Created by wangxin on 15/10/3.
 */
'use strict';

var os = require('os');
var fs = require('fs');
var PATH = require('path');
var iconv = require('iconv-lite');

var browserify = require('browserify');

var distrbute = require('./distrbute.js');
var trace = require('./trace.js');
var outputHandle = require('./output.js');
var lineation = /Windows/.test(os.type()) ? '\\' : '/';

/*
 * @author wangxin
 * 获取一个文件下所有文件路径
 * return object:
 * {
 *   fileName:filePath
 * }
 */
function getLibraryMap(fileDir, that) {
    var files = fs.readdirSync(fileDir);
    files.forEach(function (fileName) {
        var baseDir = fileDir + fileName, lstat = fs.lstatSync(baseDir);
        if (lstat.isDirectory()) {
            getLibraryMap(baseDir + lineation, that);
        } else {
            if (/^.+\.js$/.test(fileName)) {
                var key = PATH.basename(fileName, '.js');
                if (!that[key]) {
                    //处理windows下路径(E:\a\b\c.js --> E:/a/b/c.js)
                    that[key] = baseDir.replace(/\\/gi, '/');
                } else {
                    trace.error('some file in library : \n' + baseDir + '\n' + that[key]);
                }
            }
        }
    });
    return that;
}

/*
 * @author wangxin
 * 进行browserify编译
 * content: 文件内容，string;
 * outputPath: 输出文件路径
 * return false;
 */
function doBrowserify(content, outputPath, charset, config) {

    //准备做browserify编译
    fs.writeFileSync(outputPath, content);

    var b = new browserify();
    b.add(outputPath);
    b.bundle(function (err, code) {
        if (err) {
            trace.error(err);
            fs.unlinkSync(outputPath);
        } else {
            //browserify编译完成，开始输出
            outputHandle(code, outputPath, charset, config,lineation);
        }
    });
}

/*
 * @author wangxin
 * 处理加载模块文件内容为路径名
 * rjsMap: rjs文件map对象
 * libraryMap: 库文件map对象
 * return false;
 */
function doReplace(rjsMap, libraryMap, opt) {
    for (var i in rjsMap) {

        if (!i) {
            trace.error('file error');
        }

        if (rjsMap.hasOwnProperty(i)) {
            var rjsPath = PATH.resolve(process.cwd(), rjsMap[i]);

            var con = fs.readFileSync(rjsMap[i]);
            //这里不建议用gbk编码格式
            if (iconv.decode(con, 'gbk').indexOf('�') != -1) {
                var charset = 'utf8';
            } else {
                var charset = 'gbk';
            }

            var content = iconv.decode(con, charset);
            var text = content.replace(/<%bsp:(.+)%>/gi, function () {
                var key = RegExp.$1, libraryFilePath = libraryMap[key];
                if (!libraryFilePath) {
                    //<%bsp:moduleName%>通过文件名，加载某一模块
                    //当没有找到对应的库文件时，给出模块加载错误的提示
                    trace.error('file : ' + rjsPath + '\nhas no module : ' + key);
                } else {
                    return libraryFilePath;
                }
            });
            doBrowserify(text, i, charset, opt);
        }
    }
    return false;
}

module.exports = function (opts) {
    console.log(opts);

    var rjsMap = distrbute(opts);

    if (getLength.call(rjsMap) === 0) {
        trace.warn('no rjs file , process end');
    } else {
        if (opts.libraryPath) {
            //获取库文件的映射列表
            //object： fileName : filePath
            var libraryMap = getLibraryMap(PATH.resolve(process.cwd(), opts.libraryPath) + lineation, {});
        }
        doReplace(rjsMap, libraryMap || {}, opts);
    }
};
