/**
 * Created by wangxin on 15/10/3.
 */

'use strict';

var fs = require('fs');
var PATH = require('path');
var iconv = require('iconv-lite');

var browserify = require('browserify');
var Imagemin = require('imagemin');
var _ = require('lodash');


var distrbute = require('./lib/distrbute.js');
var trace = require('./lib/trace.js');
var outputHandle = require('./lib/output.js');
var listener = require('./lib/listener');
var util = require('./lib/util');

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
            getLibraryMap(baseDir + PATH.sep, that);
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
function doBrowserify(basePath, charset, config, index, cb) {
    var b = new browserify();
    b.add(basePath);
    b.bundle(function (err, code) {

        //获取到文件内容后就删除过度文件
        fs.unlinkSync(basePath);

        if (err) {
            trace.error(String(err).replace(/\.bsp/, ''));
        } else {
            //browserify编译完成，开始输出
            outputHandle(iconv.decode(code, charset), basePath, config, 'rjs');
            cb && cb(index + 1);
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
function doReplace(rjsMap, libraryMap, opt, cb) {

    var arr = [], replace = function (i) {
        if (arr[i]) {
            var path = arr[i], rjsPath = PATH.resolve(rjsMap[path]);

            var con = fs.readFileSync(rjsMap[path]), charset;
            //这里不建议用gbk编码格式
            if (iconv.decode(con, 'gbk').indexOf('�') != -1) {
                charset = 'utf8';
            } else {
                charset = 'gbk';
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

            //准备做browserify编译
            fs.writeFileSync(path, text);

            doBrowserify(path, charset, opt, i, replace);
        } else {
            cb && cb();
        }
    };

    for (var i in rjsMap) {
        if (!i) {
            trace.error('file error');
            break;
        }
        if (rjsMap.hasOwnProperty(i))  arr.push(i);
    }

    //开始替换
    return replace(0);
}

/*
 * @author wangxin
 * 文件压缩==>js、css文件
 * opts: 输出路径：文件路径
 * retrun；
 */
function doMinify(map, opts, type) {
    for (var i in map) {
        var con = fs.readFileSync(map[i]), charset;
        //这里不建议用gbk编码格式
        if (iconv.decode(con, 'gbk').indexOf('�') != -1) {
            charset = 'utf8';
        } else {
            charset = 'gbk';
        }

        outputHandle(iconv.decode(con, charset), map[i], opts, type);
    }
}

/*
 * @author wangxin
 * 压缩图片
 * opts: 输出路径：文件路径
 * retrun；
 */
function imin(map, opts, cb) {
    var i, arr = [];
    for (i in map) arr.push(map[i]);

    function min(i) {
        new Imagemin().src(arr[i]).dest(PATH.normalize(opts.image.output.path)).run(function () {
            i += 1;
            arr[i] ? min(i) : (cb && cb());
        });
    }

    min(0);
}

/*
 * @author wangxin
 * 初始化方法
 * opts: 配置参数
 * 详情参考 ../test/test.js ==> config
 */
module.exports = function (config) {

    var opts = util.extendDeep(config);

    /*
     * 文件路径的初始化
     *
     */
    var fileMap = distrbute(opts),
        rjsMap = fileMap.rjs,
        cssMap = fileMap.css,
        jsMap = fileMap.js,
        imageMap = fileMap.image,
        watchTask = function () {
            listener(opts, function (o, extname) {
                switch (extname) {
                    case 'rjs':
                        doReplace(o, libraryMap, opts);
                        break;
                    case 'css':
                        doMinify(o, opts, 'css');
                        break;
                    case 'js':
                        doMinify(o, opts, 'js');
                        break;
                    default :
                        if (opts.image.patterns.indexOf('.' + extname) != -1) {
                            imin(o, opts);
                        } else {
                            trace.warn('watch task err');
                        }
                }
            });
        },
        task_run = function () {
            //对CSS文件的处理
            if (cssMap) {
                doMinify(cssMap, opts, 'css');
                trace.ok('CSS file processing tasks completed\n');
            }

            if (jsMap) {
                doMinify(jsMap, opts, 'js');
                trace.ok('JS file processing tasks completed\n');
            }

            if (imageMap) {
                imin(imageMap, opts, function () {
                    trace.ok('image compress tasks completed\n');
                    //watch任务处理
                    opts.watch && watchTask();
                });
            } else {
                opts.watch && watchTask();
            }
        };

    /*
     * 因为rjs任务为异步操作
     * 所以放在最先执行的位置上
     */
    if (util.getLength(fileMap) !== 0) {
        if (util.getLength(rjsMap) !== 0) {
            //获取库文件的映射列表
            //object： fileName : filePath
            var libraryMap = getLibraryMap(PATH.resolve(opts.rjs.libraryPath) + PATH.sep, {});
            doReplace(rjsMap, libraryMap || {}, opts, function () {
                trace.ok('RJS file processing tasks completed\n');
                task_run();
            });
        } else {
            task_run();
        }
    } else {
        trace.warn('no file to be processed , process end');
    }
};
