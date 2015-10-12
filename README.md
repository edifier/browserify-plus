# browserify-plus

查找指定目录下得所有browserify编译文件(*/rjs/*.js || */*_rjs.js)

进行browserify编译，并通过watch功能监测(删除文件、增加文件、修改文件)

使用方法：

<pre>
    'use strict';
    var browserifyPlus = require('../index.js');
    
    var config = {
        //需要编译的文件夹
        inputPath: './src/',
        output: {
            //输出文件路径
            path: '../js/',
            //输出方式: normal、deep
            type: 'normal',
            //是否压缩
            compress: true
        },
        //引用的库文件路径
        libraryPath: '../core/',
        watch: {
            //watch轮询的时常，默认值1200
            interval: 1000
        }
    };
    browserifyPlus(config);
</pre>
