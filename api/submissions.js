// Vercel Serverless Function - 获取/删除筛选条件列表

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

export default async function handler(req, res) {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const records = await readRecords();

        // GET：获取记录列表
        if (req.method === 'GET') {
            const { name } = req.query;
            let result = records;
            if (name) {
                result = records.filter(r => r.submitter && r.submitter.name === name);
            }
            return res.status(200).json({ success: true, data: result });
        }

        // DELETE：删除指定记录
        if (req.method === 'DELETE') {
            const { id } = req.query;
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
        console.error('Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}
