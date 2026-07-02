const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'submissions.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
}

// MIME 类型映射
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// 读取提交数据
function getSubmissions() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (e) {
        return [];
    }
}

// 保存提交数据
function saveSubmissions(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// 解析请求体
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(e);
            }
        });
        req.on('error', reject);
    });
}

// 发送 JSON 响应
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

// 发送文件
function sendFile(res, filePath) {
    const ext = path.extname(filePath);
    const contentType = MIME[ext] || 'application/octet-stream';
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
}

// 创建服务器
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;
    const method = req.method;

    // ========== API 路由 ==========
    
    // 提交筛选条件（新增）
    if (method === 'POST' && pathname === '/api/submit') {
        try {
            const body = await parseBody(req);
            const submissions = getSubmissions();
            const record = {
                id: Date.now().toString(), // 用字符串 ID
                ...body,
                submittedAt: body.submittedAt || new Date().toISOString()
            };
            submissions.push(record);
            saveSubmissions(submissions);
            console.log(`[提交] ${body.submitter?.name} (${body.submitter?.department}) - ${body.jobTitle}`);
            sendJSON(res, 200, { success: true, message: '提交成功', id: record.id });
        } catch (e) {
            console.error('[错误] 提交失败:', e.message);
            sendJSON(res, 500, { success: false, message: '服务器内部错误: ' + e.message });
        }
        return;
    }

    // 获取所有提交记录（支持按 name 筛选）
    if (method === 'GET' && pathname === '/api/submissions') {
        const name = url.searchParams.get('name');
        let submissions = getSubmissions();
        
        if (name) {
            submissions = submissions.filter(s => s.submitter?.name === name);
        }
        
        sendJSON(res, 200, { success: true, data: submissions, total: submissions.length });
        return;
    }

    // 更新提交记录（PUT）
    if (method === 'PUT' && pathname.startsWith('/api/submissions/')) {
        const id = pathname.split('/').pop();
        try {
            const body = await parseBody(req);
            let submissions = getSubmissions();
            const idx = submissions.findIndex(s => s.id == id);
            
            if (idx !== -1) {
                submissions[idx] = { ...submissions[idx], ...body, updatedAt: new Date().toISOString() };
                saveSubmissions(submissions);
                sendJSON(res, 200, { success: true, message: '更新成功' });
            } else {
                sendJSON(res, 404, { success: false, message: '记录不存在' });
            }
        } catch (e) {
            sendJSON(res, 500, { success: false, message: '服务器内部错误: ' + e.message });
        }
        return;
    }

    // 删除提交记录
    if (method === 'DELETE' && pathname.startsWith('/api/submissions/')) {
        const id = pathname.split('/').pop();
        let submissions = getSubmissions();
        const before = submissions.length;
        submissions = submissions.filter(s => s.id != id);
        if (submissions.length < before) {
            saveSubmissions(submissions);
            sendJSON(res, 200, { success: true, message: '删除成功' });
        } else {
            sendJSON(res, 404, { success: false, message: '记录不存在' });
        }
        return;
    }

    // 清空所有记录
    if (method === 'DELETE' && pathname === '/api/submissions') {
        saveSubmissions([]);
        sendJSON(res, 200, { success: true, message: '已清空所有记录' });
        return;
    }

    // 导出数据
    if (method === 'GET' && pathname === '/api/export') {
        const submissions = getSubmissions();
        res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': 'attachment; filename="submissions.json"'
        });
        res.end(JSON.stringify(submissions, null, 2));
        return;
    }

    // ========== 静态文件服务 ==========
    
    if (method === 'GET') {
        let filePath;
        if (pathname === '/' || pathname === '/index.html') {
            filePath = path.join(__dirname, 'index.html');
        } else if (pathname === '/admin' || pathname === '/admin.html') {
            filePath = path.join(__dirname, 'admin.html');
        } else {
            filePath = path.join(__dirname, pathname);
        }
        sendFile(res, filePath);
        return;
    }

    // 404
    sendJSON(res, 404, { success: false, message: '接口不存在' });
});

server.listen(PORT, () => {
    console.log('');
    console.log('  ========================================');
    console.log('                                         ');
    console.log('    BOSS直聘 - 候选人筛选条件提交系统      ');
    console.log('                                         ');
    console.log('  ========================================');
    console.log('');
    console.log(`  服务已启动:  http://localhost:${PORT}`);
    console.log(`  提交表单页:  http://localhost:${PORT}`);
    console.log(`  管理后台页:  http://localhost:${PORT}/admin.html`);
    console.log('');
    console.log(`  数据存储于:  ${DATA_FILE}`);
    console.log('');
    console.log('  按 Ctrl+C 停止服务');
    console.log('');
});
