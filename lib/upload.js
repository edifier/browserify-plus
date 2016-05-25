var fs = require('fs');
var PATH = require('path');
var readline = require('readline');

var Client = require('ssh2').Client;

var trace = require('./trace.js');
var util = require('./util.js');


var config = {
    //默认上传js
    cwd: 'js/',
    userInfo: {
        name: "root",
        password: "d7PGxcf3bhx9YoZJpGFm"
    },
    ftp: {
        host: '10.154.250.38',
        port: 22,
        basePath: '/data/static/pay/test/'
    }
};

function go(files, i) {

    var len = files.length;

    function upload(localfile, remoteFile) {
        var c = new Client();

        c.on('ready', function () {
            c.sftp(function (err, sftp) {
                if (err) throw err;
                sftp.fastPut(localfile.replace(/\\/g, '/'), remoteFile.replace(/\\/g, '/'), function (err) {
                    if (err) throw err;
                    c.end();
                    trace.ok(localfile + ' :上传完成！');
                    go(files, ++i);
                });
            });
        });

        c.connect({
            host: config.ftp.host,
            port: config.ftp.port,
            username: config.userInfo.name,
            password: config.userInfo.password
        });
    }

    if (i < len) {
        var file = files[i];
        upload(util.relative(config.cwd, file).replace(/\\/g, '/'), util.relative(config.ftp.basePath, file).replace(/\\/g, '/'));
    } else {
        trace.ok('全部文件上传完毕!');
    }
}

module.exports = function (type) {

    if (!type || type == 'js') {
        var cwd = 'js/';
    } else if (type == 'css') {
        var cwd = 'css/';
    }
    config.cwd = util.relative(process.cwd(), cwd);
    config.ftp.basePath = util.relative(config.ftp.basePath, cwd);

    try {
        var files = fs.readdirSync(config.cwd);
    } catch (e) {
        trace.error('上传任务需要输入一个路径');
        process.exit(1);
    }


    if (files.length === 0) {
        trace.log('没有需要上传的文件，进程结束');
        process.exit(1);
    }

    trace.load('\n上线文件清单 : ');
    trace.ok(files.join('\n'));
    trace.log('\n');

    process.stdin.setEncoding('utf8');
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('你确定上传以上文件吗？(Y/N)', function (data) {

        data = data.trim();
        rl.close();

        if (data == 'Y') {
            go(files, 0);
        } else {
            process.exit(1);
        }
    });
};