const { getCollection } = require('./db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { date, checkin_time, is_sunday, notes, salary } = req.body;
  if (!date || !checkin_time) return res.status(400).json({ error: 'date and checkin_time required' });

  try {
    const col = await getCollection();
    const existing = await col.findOne({ date });
    if (existing && existing.checkin_time) return res.status(400).json({ error: 'Check-in already done for today' });

    const record = {
      date, checkin_time, checkout_time: null,
      is_sunday: is_sunday || false,
      is_different_day: false, morning_checkin: null,
      notes: notes || '', salary: salary || 28600,
      morning_ot: 0, morning_food: 0, evening_ot: 0, evening_food: 0,
      full_day_triggered: false, full_day_val: 0, total_ot: 0,
      per_day_val: 0, month_days: 0,
      created_at: new Date(), updated_at: new Date(),
    };

    await col.updateOne({ date }, { $set: record }, { upsert: true });
    res.status(200).json({ success: true, record });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
