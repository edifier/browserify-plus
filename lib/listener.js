/**
 * Created by wangxin8 on 2015/10/21.
 * watch任务
 */

'use strict';
var PATH = require('path');

var watch = require('watch');

var trace = require('./trace.js');
var util = require('./util.js');

/*
 * @author wangxin
 * 循环输出文件修改
 * file: 文件路径数组
 * msg： 信息
 */
function log(file, msg) {
    for (var i = 0, len = file.length; i < len; i++) {
        trace.log(file[i] + ' : has been ' + msg);
    }
}

function listener(opts, cb) {

    var cacheArr = [], timer;

    //监听文件的规则
    function rule(file) {

        var extname = PATH.extname(file);

        if (opts.rjs && opts.rjs.libraryPath && util.isInDirectory(file, opts.rjs.libraryPath)) {
            return false;
        }

        if ((extname === '.js' && opts.js) || (util.testRJS(file) && opts.rjs) || extname === '' || (extname === '.css' && opts.css) || (opts.image && opts.image.patterns.indexOf(extname) !== -1)) {
            return true;
        }

        return false;
    }

    //处理逻辑
    function handle(file, curr, pre) {

        if (typeof file == "object" && pre === null && curr === null) {
            trace.ok('watch task has been started...\n');
            return false;
        }

        function delay(callback) {
            timer && clearTimeout(timer);
            cacheArr.indexOf(file) === -1 && cacheArr.push(file);

            timer = setTimeout(function () {
                callback && callback(cacheArr);
                cacheArr = [];
            }, 50);
        }

        var extname = PATH.extname(file).replace(/\./, '');

        if (pre === null) {
            //将文件名重命名为rjs文件夹的相应，waiting....
            //延迟处理批量增加
            extname != '' && delay(function (path) {
                cb && cb(path, util.testRJS(file) ? 'rjs' : extname);
                log(path, 'built');
            });
        } else if (curr.nlink === 0) {
            //延迟处理批量删除
            extname != '' && delay(function (path) {
                cb && cb(path, util.testRJS(file) ? 'rjs' : extname, 'remove');
                log(path, 'removed');
            });
        } else {
            cb && cb([file], util.testRJS(file) ? 'rjs' : extname);
            trace.log(file + ' has been changed at ' + new Date());
        }
    }

    //执行监听
    watch.watchTree(opts.inputPath, {
        filter: rule,
        interval: opts.watch.interval || 1200
    }, handle);

    //库文件的监听
    if (opts.rjs && opts.rjs.libraryPath) {
        watch.watchTree(opts.rjs.libraryPath, {
            filter: function (file) {
                return PATH.extname(file) == '.js' || PATH.extname(file) == '';
            },
            interval: opts.watch.interval || 1200
        }, function (file, curr, pre) {
            if (typeof file != "object" || pre !== null || curr !== null) {
                if (pre === null) {
                    if (PATH.extname(file) == '') {
                        cb && cb(file, 'rjs', 'resetLibA');
                    } else {
                        cb && cb([], 'rjs');
                    }
                }
                else if (curr.nlink === 0) {
                    cb && cb(file, 'rjs', 'resetLibD');
                } else {
                    cb && cb([], 'rjs');
                }
                trace.log('library file changed at ' + new Date());
            }
        });
    }
}

module.exports = listener;