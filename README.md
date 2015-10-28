# browserify-plus

## Installation	

	npm install browserify-plus [-g]

## Explain
	
	查找指定目录下得所有使用commonJS规范编写的js文件(*/rjs/*.js || */*_rjs.js)
	
	进行browserify编译(支持短命名方式引用模块)，并同步文件修改(删除文件、增加文件、修改文件)

	在*/browserify-plus/执行:npm test，*/browserify-plus/js/文件内查看编译后的代码
	
	增加-g参数以后，按照./test/config.bsp.js建立同名文件，全局执行browserify-plus命令
	
	增加了对js、css和image文件的压缩处理，css文件支持@import引用，详细配置参考下面的例子

## Options

	* `inputPath` -- 需要进行编译的文件夹名称
	* `output.banner` -- 输出文件banner ==> <%time%>:更新时间
	* `output.path` -- 输出文件的路径
	* `output.type` -- 输出方式
		
		`normal`: 单独文件输出  `deep`: 包含路径输出
		
	* `output.compress` -- boolean 是否压缩
	* `libraryPath` -- 库文件路径，被引用时可以使用<%bsp:file_name%>方式引入
	* `watch` -- 是否同步更新，`interval`为轮询时常

## Example
	
	方法调用：
~~~ javascript
	
	//调用方法 from: ./test/test.js
    var browserifyPlus = require('browserify-plus'); 
    var config = {
        //需要编译的文件夹
		inputPath: './test/src',
		js: {
			output: {
				//输出banner
				banner: '/*build at <%time%>*/\n',
				//输出文件路径
				path: './js',
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
				path: './js',
				//输出方式: normal、deep
				type: 'normal',
				//是否压缩
				compress: true
			},
			//引用的库文件路径
			libraryPath: './core'
		},
		css: {
			output: {
				//输出banner
				banner: '/*build at <%time%>*/\n',
				//输出文件路径
				path: './css',
				//输出方式: normal、deep
				type: 'normal',
				//是否压缩
				compress: true
			}
		},
		image: {
        	output: {
            	//输出文件路径
            	path: './i'
        	},
        	patterns: ['.png', '.jpg', '.gif']
    	},
		//css:false,
		watch: {
			//watch轮询的时常，默认值1200
			interval: 800
		}
    };
    browserifyPlus(config);
    
~~~

	业务代码：
~~~ javascript
	
	//from: ./test/src/rjs/test.js
	//clear为库文件路径内的clear.js文件
	//库外模块文件不支持短命名形式引用
	var clear = require('<%bsp:clear%>');
	console.log(clear([1,null,'']));
	
~~~
~~~ css
	
	/*from: ./test/src/css/t.css*/
	/*css文件支持@import引用*/
	@import url('./test_2.css');
	@import url('../test.css');

	div {
    	height: 100px;
	}

~~~

## License

	(The MIT License) Copyright (c) 2012 - 2015 edifier
	
	


