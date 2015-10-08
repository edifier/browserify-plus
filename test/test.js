/**
 * Created by wangxin8 on 2015/10/8.
 * 测试文件，终端：node test.js
 */

'use strict';
var browserifyPlus = require('../index.js');

browserifyPlus({
    //需要编译的文件夹
    inputPath: '../src',
    output: {
        //输出文件路径
        path: '../js/',
        //输出方式: normal、deep
        type: 'normal',
        //是否压缩
        compress: true
    },
    //引用的库文件路径
    libraryPath: '../core/'
});
