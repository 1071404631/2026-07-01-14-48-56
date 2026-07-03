// Vercel Serverless Function - 提交筛选条件
const https = require('https');

const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY || 'YOUR_JSONBIN_API_KEY';
const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID || 'YOUR_BIN_ID';

// 使用 Node 原生 https 请求 JSONBin，避免 fetch 运行时差异
function jsonbinRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.jsonbin.io',
            path: path,
            method: method,
            headers: {
                'X-Master-Key': JSONBIN_API_KEY,
                ...(body ? { 'Content-Type': 'application/json' } : {})
            }
        };

        const request = https.request(options, (response) => {
            let data = '';
            response.on('data', chunk => { data += chunk; });
            response.on('end', () => {
                try {
                    const status = response.statusCode || 0;
                    const parsed = data ? JSON.parse(data) : null;
                    if (status >= 200 && status < 300) {
                        resolve({ status, data: parsed });
                    } else {
                        reject(new Error(`JSONBin ${method} ${path} 失败 (${status}): ${data}`));
                    }
                } catch (e) {
                    reject(new Error(`JSONBin 响应解析失败: ${e.message}`));
                }
            });
        });

        request.on('error', (err) => reject(new Error(`JSONBin 请求失败: ${err.message}`)));

        if (body) {
            request.write(JSON.stringify(body));
        }
        request.end();
    });
}

async function readRecords() {
    const result = await jsonbinRequest(`/v3/b/${JSONBIN_BIN_ID}/latest`, 'GET');
    let records = (result.data && result.data.record && result.data.record.records) || [];
    if (!Array.isArray(records)) records = [];
    return records;
}

async function writeRecords(records) {
    await jsonbinRequest(`/v3/b/${JSONBIN_BIN_ID}`, 'PUT', { records });
}

// 读取请求体（兼容 Vercel 自动解析和原始流）
function getBody(req) {
    return new Promise((resolve, reject) => {
        if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body) && !(req.body instanceof Uint8Array) && Object.keys(req.body).length > 0) {
            return resolve(req.body);
        }
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(new Error('请求体 JSON 解析失败'));
            }
        });
        req.on('error', reject);
    });
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        return res.end();
    }

    if (req.method !== 'POST') {
        res.statusCode = 405;
        return res.end(JSON.stringify({ success: false, message: 'Method not allowed' }));
    }

    try {
        const data = await getBody(req);

        if (!data || typeof data !== 'object') {
            res.statusCode = 400;
            return res.end(JSON.stringify({ success: false, message: '请求体不能为空' }));
        }

        const records = await readRecords();

        data.id = Date.now().toString();
        data.createdAt = new Date().toISOString();
        records.push(data);

        await writeRecords(records);

        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true, data: data }));
    } catch (error) {
        console.error('Submit error:', error);
        res.statusCode = 500;
        return res.end(JSON.stringify({ success: false, message: error.message }));
    }
};
