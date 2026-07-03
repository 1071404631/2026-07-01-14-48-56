// Vercel Serverless Function - 获取/更新/删除筛选条件列表
const { URL } = require('url');

const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY || 'YOUR_JSONBIN_API_KEY';
const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID || 'YOUR_BIN_ID';

// 读取请求体（兼容 Vercel 自动解析和原始流）
function getBody(req) {
    return new Promise((resolve, reject) => {
        if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
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

async function readRecords() {
    const getRes = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
        headers: { 'X-Master-Key': JSONBIN_API_KEY }
    });
    if (!getRes.ok) {
        const text = await getRes.text();
        throw new Error(`JSONBin 读取失败 (${getRes.status}): ${text}`);
    }
    const getData = await getRes.json();
    let records = (getData.record && getData.record.records) || [];
    if (!Array.isArray(records)) records = [];
    return records;
}

async function writeRecords(records) {
    const putRes = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': JSONBIN_API_KEY
        },
        body: JSON.stringify({ records })
    });
    if (!putRes.ok) {
        const text = await putRes.text();
        throw new Error(`JSONBin 写入失败 (${putRes.status}): ${text}`);
    }
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const url = new URL(req.url, 'http://localhost');
        // 解析路径 ID：/api/submissions/xxx
        const pathMatch = url.pathname.match(/^\/api\/submissions(?:\/([^/]+))?$/);
        const pathId = pathMatch ? pathMatch[1] : undefined;
        const query = Object.fromEntries(url.searchParams);

        const records = await readRecords();

        if (req.method === 'GET') {
            if (query.name) {
                const result = records.filter(r => r.submitter && r.submitter.name === query.name);
                return res.status(200).json({ success: true, data: result });
            }
            return res.status(200).json({ success: true, data: records });
        }

        if (req.method === 'DELETE') {
            // 同时支持 ?id=xxx 和 /api/submissions/xxx 两种传参方式
            const id = query.id || pathId;
            if (!id) {
                return res.status(400).json({ success: false, message: '缺少记录ID' });
            }
            const before = records.length;
            const newRecords = records.filter(r => String(r.id) !== String(id));
            if (newRecords.length === before) {
                return res.status(404).json({ success: false, message: '未找到该记录' });
            }
            await writeRecords(newRecords);
            return res.status(200).json({ success: true, message: '删除成功' });
        }

        if (req.method === 'PUT') {
            const id = query.id || pathId;
            if (!id) {
                return res.status(400).json({ success: false, message: '缺少记录ID' });
            }
            const body = await getBody(req);
            const idx = records.findIndex(r => String(r.id) === String(id));
            if (idx === -1) {
                return res.status(404).json({ success: false, message: '未找到该记录' });
            }
            // 保留原 id 和 createdAt，其他字段覆盖
            records[idx] = {
                ...records[idx],
                ...body,
                id: records[idx].id,
                createdAt: records[idx].createdAt
            };
            await writeRecords(records);
            return res.status(200).json({ success: true, message: '更新成功' });
        }

        return res.status(405).json({ success: false, message: 'Method not allowed' });
    } catch (error) {
        console.error('Submissions error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
