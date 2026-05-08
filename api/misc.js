const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
let cachedClient = null;

async function getCollection() {
  if (!cachedClient) {
    cachedClient = new MongoClient(uri, { maxPoolSize: 1 });
    await cachedClient.connect();
  }
  return cachedClient.db('overtime_tracker').collection('misc_entries');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const col = await getCollection();

    // ── GET — list all entries ──
    if (req.method === 'GET') {
      const entries = await col.find({}).sort({ date: -1, created_at: -1 }).toArray();
      return res.status(200).json({ entries });
    }

    // ── POST — create new entry ──
    if (req.method === 'POST') {
      const { name, date, note } = req.body;
      if (!name || !date) return res.status(400).json({ error: 'name and date required' });
      const entry = {
        name: name.trim(),
        date,
        note: (note || '').trim(),
        created_at: new Date(),
        updated_at: new Date(),
      };
      const result = await col.insertOne(entry);
      return res.status(200).json({ success: true, entry: { ...entry, _id: result.insertedId } });
    }

    // ── PUT — update entry ──
    if (req.method === 'PUT') {
      const { ObjectId } = require('mongodb');
      const { id, name, date, note } = req.body;
      if (!id || !name || !date) return res.status(400).json({ error: 'id, name and date required' });
      await col.updateOne(
        { _id: new ObjectId(id) },
        { $set: { name: name.trim(), date, note: (note || '').trim(), updated_at: new Date() } }
      );
      return res.status(200).json({ success: true });
    }

    // ── DELETE — delete entry ──
    if (req.method === 'DELETE') {
      const { ObjectId } = require('mongodb');
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id required' });
      await col.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
