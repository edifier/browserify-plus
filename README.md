# browserify-plus

## Installation	

	npm install browserify-plus	

## Explain

	查找指定目录下得所有使用commonJS规范编写的js文件(*/rjs/*.js || */*_rjs.js)

	进行browserify编译，并同步文件修改(删除文件、增加文件、修改文件)

## Options

	* `inputPath` -- 需要进行编译的文件夹名称
	* `output.path` -- 输出文件的路径
	* `output.type` -- 输出方式
		
		`normal`: 单独文件输出  `deep`: 包含路径输出
		
	* `output.compress` -- boolean 是否压缩
	* `libraryPath` -- 库文件路径，被引用时可以使用<%bsp:file_name%>方式引入
	* `watch` -- 是否同步更新，`interval`为轮询时常

## Example
	
~~~ javascript
	
	//调用方法 ./test/test.js
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
    
~~~ javascript

~~~ javascript
	
	//引用模块 ./test/src/rjs/test.js
	//nameSpace为库文件路径内的nameSpace.js文件
	var nameSpace = require('<%bsp:nameSpace%>');
	console.log(nameSpace);
	
~~~ javascript

## Github

	https://github.com/edifier/browserify-plus
	


