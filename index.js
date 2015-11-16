/**
 * Created by wangxin on 15/10/3.
 */

'use strict';

var fs = require('fs');
var PATH = require('path');
var iconv = require('iconv-lite');

var browserify = require('browserify');
var Imagemin = require('imagemin');

var distrbute = require('./lib/distrbute');
var trace = require('./lib/trace');
var outputHandle = require('./lib/output');
var listener = require('./lib/listener');
var util = require('./lib/util');

/*
 * @author wangxin
 * 获取执行任务的参数
 * file: 文件路径
 * return object;
 */
function getArgs(file) {
    var o = arguments[1] || {},
        type = arguments[2] || null,
        i = 0, len = file.length;

    if (len == 0) return o;
    for (; i < len; i++) {
        var path = PATH.resolve(file[i]);
        if (!type) {
            !o[path] && (o[path] = file[i]);
        } else if (type === 'remove') {
            delete o[path];
        }
    }
    return o;
}


/*
 * @author wangxin
 * 获取一个文件下所有文件路径
 * return arr ['dirPath','dirPath',...]
 */
function getLibraryMap(fileDir) {
    var files = fs.readdirSync(fileDir), arr = arguments[1] || [];
    files.forEach(function (fileName) {
        var baseDir = fileDir + fileName, lstat = fs.lstatSync(baseDir);
        if (lstat.isDirectory()) {
            getLibraryMap(baseDir + PATH.sep, arr);
        } else {
            var file = PATH.dirname(baseDir);
            arr.indexOf(file) === -1 && arr.push(PATH.normalize(file));
        }
    });
    return arr;
}

/*
 * @author wangxin
 * 进行browserify编译
 * content: 文件内容，string;
 * outputPath: 输出文件路径
 * return;
 */
function doBrowserify(basePath, libraryMap, config, index, cb) {
    var b = new browserify({
        entries: basePath,
        paths: libraryMap,
        debug: config.rjs.debug || false
    });
    b.bundle(function (err, code) {
        if (err) {
            module.timer && clearTimeout(module.timer);
            module.timer = setTimeout(function () {
                module.timer && clearTimeout(module.timer);
                module.timer = null;
                cb && cb(index + 1);
            }, 50);
            trace.error(String(err));
        } else {
            //browserify编译完成，开始输出
            outputHandle(iconv.decode(code, 'utf8'), basePath, config, 'rjs');
            code = null;
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
function walk(rjsMap, libraryMap, opt, cb) {

    var arr = [], go = function (i) {
        if (arr[i]) {
            doBrowserify(arr[i], libraryMap, opt, i, go);
        } else {
            cb && cb();
        }
        return false;
    };

    for (var i in rjsMap) {
        if (!i) {
            trace.error('file error');
            break;
        }
        if (rjsMap.hasOwnProperty(i))  arr.push(rjsMap[i]);
    }

    //开始编译
    return go(0);
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
        con = null;
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

    /**
     * 文件路径的初始化
     */
    var fileMap = distrbute(opts),
        rjsMap = fileMap.rjs,
        cssMap = fileMap.css,
        jsMap = fileMap.js,
        imageMap = fileMap.image,
        watchTask = function () {
            listener(opts, function (file, extname, type) {
                switch (extname) {
                    case 'rjs':
                        if (!type) {
                            walk(getArgs(file, rjsMap, type), libraryMap, opts);
                        } else if (type == 'remove') {
                            rjsMap = getArgs(file, rjsMap, type);
                        } else {
                            file = PATH.normalize(PATH.resolve(file));
                            if (type === 'resetLibA') {
                                libraryMap.indexOf(file) === -1 && libraryMap.push(file);
                            }
                            else if (type === 'resetLibD') {
                                libraryMap = util.removeEle.call(libraryMap, file);
                            }
                        }
                        break;
                    case 'css':
                        if (!type) {
                            doMinify(getArgs(file, cssMap, type), opts, 'css');
                        } else if (type == 'remove') {
                            cssMap = getArgs(file, cssMap, type);
                        }
                        break;
                    case 'js':
                        doMinify(getArgs(file), opts, 'js');
                        break;
                    case '' :
                        break;
                    default :
                        if (opts.image.patterns.indexOf('.' + extname) != -1) {
                            imin(getArgs(file), opts);
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
            //arr: ['dirname']
            var libraryMap = getLibraryMap(PATH.resolve(opts.rjs.libraryPath) + PATH.sep, [PATH.resolve(opts.inputPath) + PATH.sep]);
            walk(rjsMap, libraryMap, opts, function () {
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
