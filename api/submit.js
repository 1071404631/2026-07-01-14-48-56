// Vercel Serverless Function - 提交筛选条件
// 存储到 JSONBin.io (免费，无需银行卡)

const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY || 'YOUR_JSONBIN_API_KEY';
const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID || 'YOUR_BIN_ID';

async function readRecords() {
    const getRes = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
        headers: {
            'X-Master-Key': JSONBIN_API_KEY
        }
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
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const data = req.body;

        // 获取现有数据
        const records = await readRecords();

        // 添加新记录
        data.id = Date.now().toString();
        data.createdAt = new Date().toISOString();
        records.push(data);

        // 保存回 JSONBin
        await writeRecords(records);

        return res.status(200).json({ success: true, data: data });
    } catch (error) {
        console.error('Submit error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
