const { getCollection } = require('./db');
const { calculateOT }  = require('./calculator');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { date, checkout_time, is_different_day, morning_checkin, salary } = req.body;
  if (!date || !checkout_time) return res.status(400).json({ error: 'date and checkout_time required' });

  try {
    const col = await getCollection();
    const existing = await col.findOne({ date });
    if (!existing) return res.status(400).json({ error: 'No check-in found for this date' });
    if (existing.checkout_time) return res.status(400).json({ error: 'Already checked out today' });

    const otResult = calculateOT({
      date,
      checkin_time:     existing.checkin_time,
      checkout_time,
      is_sunday:        existing.is_sunday,
      is_different_day: is_different_day || false,
      morning_checkin:  morning_checkin || null,
      salary:           salary || existing.salary || 28600,
    });

    const updates = {
      checkout_time,
      is_different_day: is_different_day || false,
      morning_checkin:  morning_checkin || null,
      ...otResult,
      updated_at: new Date(),
    };

    await col.updateOne({ date }, { $set: updates });
    res.status(200).json({ success: true, record: { ...existing, ...updates } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
