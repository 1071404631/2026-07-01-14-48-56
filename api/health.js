// 最简测试函数 — 验证 Vercel Function 基础设施是否正常
module.exports = function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, message: 'API 正常运行', time: new Date().toISOString() }));
};
