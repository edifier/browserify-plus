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

function listener(opts, cb) {

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
        } else if (pre === null) {
            if (!(fs.lstatSync(file).isDirectory())) {
                cb && cb(file, testRJS(file) ? 'rjs' : PATH.extname(file).replace(/\./, ''));
                trace.log(file + ' : has been built');
            }
        } else if (curr.nlink === 0) {
            //var p = PATH.resolve(opts.output.path) + PATH.sep + file;
            //normal模式下，同时将压缩文件删除
            //opts.output.type === 'normal' && fs.unlinkSync(p);
            trace.log(file + ' : has been removed');
        } else {
            cb && cb(file, testRJS(file) ? 'rjs' : PATH.extname(file).replace(/\./, ''));
            trace.log(file + ' : has been changed at ' + new Date());
        }
    }

    //执行监听
    watch.watchTree(opts.inputPath, {
        filter: rule,
        interval: opts.watch.interval || 1200
    }, handle);

}

module.exports = listener;
