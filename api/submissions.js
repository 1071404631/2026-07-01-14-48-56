// Vercel Serverless Function - 获取筛选条件列表

const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY || 'YOUR_JSONBIN_API_KEY';
const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID || 'YOUR_BIN_ID';

export default async function handler(req, res) {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { name } = req.query;

        // 从 JSONBin 获取数据
        const getRes = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY
            }
        });
        const getData = await getRes.json();
        let records = (getData.record && getData.record.records) || [];

        if (!Array.isArray(records)) records = [];

        // 按姓名筛选
        if (name) {
            records = records.filter(r => r.submitter && r.submitter.name === name);
        }

        return res.status(200).json({ success: true, data: records });
    } catch (error) {
        console.error('Fetch error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}
