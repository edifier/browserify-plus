/*
 * author wangxin
 * 不同颜色表示不同的提示文案
 */


module.exports = {
    log: function (msg) {
        console.log(msg);
    },
    ok: function (msg) {
        //green
        console.log('\033[1m\033[32m' + msg + '\033[0m');
    },
    warn: function (msg) {
        //yellow
        console.log('\033[1m\033[33m' + msg + '\033[0m');
    },
    error: function (msg) {
        //red
        console.log('\033[1m\033[31m' + msg + '\033[0m');
    }
};

