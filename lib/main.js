/**
 * Created by wangxin on 15/10/3.
 */
'use strict';

var fs = require('fs');
var PATH = require('path');
var iconv = require('iconv-lite');
var watch = require('watch');

var browserify = require('browserify');

var distrbute = require('./distrbute.js');
var trace = require('./trace.js');
var outputHandle = require('./output.js');

function getLength() {
    var i = 0, o = arguments[0];
    for (var j in o) (o.hasOwnProperty(j) && o[j]) && i++;
    return i;
}

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
function doBrowserify(basePath, charset, config) {
    var b = new browserify();
    b.add(basePath);
    b.bundle(function (err, code) {
        if (err) {
            trace.error(err);
            fs.unlinkSync(basePath);
        } else {
            //browserify编译完成，开始输出
            outputHandle(code, basePath, charset, config, PATH.sep);
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
            var rjsPath = PATH.resolve(rjsMap[i]);

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

            //准备做browserify编译
            fs.writeFileSync(i, text);

            doBrowserify(i, charset, opt);
        }
    }
    return false;
}

/*
 * @author wangxin
 * 初始化方法
 * opts: 配置参数
 * 详情参考 ../test/test.js ==> config
 */
module.exports = function (opts) {

    var rjsMap = distrbute(opts);

    if (getLength(rjsMap) === 0) {
        trace.warn('no rjs file , process end');
        return false;
    } else {
        if (opts.libraryPath) {
            //获取库文件的映射列表
            //object： fileName : filePath
            var libraryMap = getLibraryMap(PATH.resolve(opts.libraryPath) + PATH.sep, {});
        }
        doReplace(rjsMap, libraryMap || {}, opts);
    }

    if (opts.watch) {
        watch.watchTree(opts.inputPath, {
            filter: function (file) {
                if (PATH.extname(file) === '.js') {
                    var fileName = PATH.basename(file);
                    //windows的路径格式按unix处理
                    var f = file.replace(/\\/gi, '/');
                    //忽略掉所用文件名为*.bsp.js的修改
                    if (/.*\.bsp\.js/gi.test(fileName)) {
                        return false;
                    } else if (/.+\/rjs\/.*\.js/gi.test(f) || /.+_rjs\.js/gi.test(fileName)) {
                        return true;
                    } else {
                        return false;
                    }
                } else if (PATH.extname(file) === '') {
                    return true;
                } else {
                    return false;
                }
            },
            interval: opts.watch.interval || 1200
        }, function (file, curr, pre) {

            //处理连续调用两次的情况
            if (curr && curr.mtime) {
                if (module.ct == new Date(curr.mtime).getTime()) return false;
                module.ct = new Date(curr.mtime).getTime();
            }

            if (typeof file == "object" && pre === null && curr === null) {
                trace.ok('browserify-plus task to monitor the file : ' + opts.inputPath);
            } else if (pre === null) {
                if (!(fs.lstatSync(file).isDirectory())) {
                    var o = {};
                    o[PATH.dirname(file) + PATH.sep + PATH.basename(file, '.js') + '.bsp.js'] = file;
                    doReplace(o, libraryMap || {}, opts);
                    trace.log(file + ' : has been built.');
                }
            } else if (curr.nlink === 0) {
                if (PATH.extname(file) === '') return false;
                var p = PATH.resolve(opts.output.path) + PATH.sep + PATH.basename(file, '.js') + '.js';
                //normal模式下，同时将压缩文件删除
                opts.output.type === 'normal' && fs.unlinkSync(p);
                trace.log(file + ' : has been removed.');
            } else {
                var o = {};
                o[PATH.dirname(file) + PATH.sep + PATH.basename(file, '.js') + '.bsp.js'] = file;
                doReplace(o, libraryMap || {}, opts);
                trace.log(file + ' : has been changed.');
            }
        });
    }
};
