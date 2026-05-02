const { getCollection } = require('./db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date required' });

  try {
    const col = await getCollection();
    const record = await col.findOne({ date });
    res.status(200).json({ record: record || null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
