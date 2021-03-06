/**
 * Created by wangxin8 on 2015/10/8.
 * 全局命令查找的配置文件
 */

'use strict';

module.exports = {
    //需要编译的文件夹
    inputPath: './src',
    js: {
        output: {
            //输出banner
            banner: '/*build at <%time%>*/\n',
            //输出文件路径
            path: '../js',
            //输出方式: normal、deep
            type: 'normal',
            //是否压缩
            compress: true
        }
    },
    rjs: {
        output: {
            //输出banner
            banner: '/*build at <%time%>*/\n',
            //输出文件路径
            path: '../js',
            //输出方式: normal、deep
            type: 'normal',
            //是否压缩
            compress: true
        },
        //引用的库文件路径
        libraryPath: '../core'
    },
    css: {
        output: {
            //输出banner
            banner: '/*build at <%time%>*/\n',
            //输出文件路径
            path: '../css',
            type: 'normal'
        }
    },
    image: {
        output: {
            //输出文件路径
            path: '../i'
        },
        patterns: ['.png', '.jpg', '.gif']
    },
    watch: {
        //watch轮询的时常，默认值1200
        interval: 800
    }
    //watch:false
};