// Vercel Serverless Function - 获取/删除筛选条件列表
const { URL } = require('url');

const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY || 'YOUR_JSONBIN_API_KEY';
const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID || 'YOUR_BIN_ID';

// 获取查询参数（兼容 req.query）
function getQuery(req) {
    if (req.query && Object.keys(req.query).length > 0) return req.query;
    const url = new URL(req.url, 'http://localhost');
    return Object.fromEntries(url.searchParams);
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const records = await readRecords();
        const query = getQuery(req);

        if (req.method === 'GET') {
            if (query.name) {
                const result = records.filter(r => r.submitter && r.submitter.name === query.name);
                return res.status(200).json({ success: true, data: result });
            }
            return res.status(200).json({ success: true, data: records });
        }

        if (req.method === 'DELETE') {
            const id = query.id;
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

        return res.status(405).json({ success: false, message: 'Method not allowed' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
