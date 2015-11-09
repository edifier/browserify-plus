/**
 * Created by wangxin8 on 2015/10/21.
 * watch任务
 */

'use strict';
var fs = require('fs');
var PATH = require('path');

var watch = require('watch');

var trace = require('./trace.js');

/*
 * @author wangxin
 * 校验文件是否是rjs文件
 * file: 文件路径
 * return boolean;
 */
function testRJS(file) {
    return /.+\/rjs\/.*\.js/gi.test(file.replace(/\\/gi, '/')) || /.+_rjs\.js/gi.test(PATH.basename(file));
}

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

        if ((extname === '.js' && opts.js) || (testRJS(file) && opts.rjs) || extname === '' || (extname === '.css' && opts.css) || (opts.image && opts.image.patterns.indexOf(extname) !== -1)) {
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

        function go(file, curr, pre) {

            var fp, en, path = (function (array) {
                var arr = [], i = 0, len = array.length;
                for (; i < len; i++) {
                    //修改的所有文件信息，以第一个为标准
                    if (i == 0) {
                        fp = array[0];
                        en = PATH.extname(array[0]);
                    }
                    en === PATH.extname(array[i]) && arr.push(array[i]);
                }
                return arr;
            })(Object.prototype.toString.call(file) !== '[object Array]' ? [file] : file);

            var extname = PATH.extname(fp).replace(/\./, '');

            if (pre === null) {
                if (!fs.lstatSync(fp).isDirectory()) {
                    cb && cb(path, testRJS(fp) ? 'rjs' : extname);
                }
                log(path, 'built');
            } else if (curr.nlink === 0) {
                cb && cb(path, testRJS(fp) ? 'rjs' : extname, 'remove');
                log(path, 'removed');
            } else {
                cb && cb(path, testRJS(fp) ? 'rjs' : extname);
                log(path, 'changed at ' + new Date());
            }
            cacheArr = [];
        }

        var args = arguments;

        timer && clearTimeout(timer);
        cacheArr.push(args[0]);

        timer = setTimeout(function () {
            if (cacheArr.length == 1) {
                go.apply(exports, args);
            } else {
                go(cacheArr, curr, pre);
            }
        }, 50);
    }

    //执行监听
    watch.watchTree(opts.inputPath, {
        filter: rule,
        interval: opts.watch.interval || 1200
    }, handle);

}

module.exports = listener;
