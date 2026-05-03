const { getCollection } = require('./db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { month, year } = req.query;
  if (!month || !year) return res.status(400).json({ error: 'month and year required' });

  const m = parseInt(month);
  const y = parseInt(year);
  const startDate = `${y}-${String(m).padStart(2,'0')}-01`;
  const endDate   = `${y}-${String(m).padStart(2,'0')}-31`;

  try {
    const col = await getCollection();
    const records = await col.find({ date: { $gte: startDate, $lte: endDate } }).sort({ date: -1 }).toArray();

  // let total_ot = 0, total_food = 0, days_worked = 0, days_fullday = 0, food_days = 0;
  let total_ot = 0, total_food = 0, days_worked = 0, days_fullday = 0, food_days = 0, sunday_days = 0, total_sunday = 0;

records.forEach(r => {
  if (r.checkout_time) {
    days_worked++;
    total_ot   += r.total_ot || 0;
    total_food += (r.morning_food || 0) + (r.evening_food || 0);
    if (r.full_day_triggered) days_fullday++;
    if ((r.morning_food || 0) + (r.evening_food || 0) > 0) food_days++;
    if (r.is_sunday) { sunday_days++; total_sunday += r.full_day_val || 0; } // ← YE ADD KARO
  }
});

    res.status(200).json({
      records,
      total_ot:    parseFloat(total_ot.toFixed(2)),
      total_food:  parseFloat(total_food.toFixed(2)),
      days_worked,
      sunday_days,
      days_fullday,
      total_sunday:  parseFloat(total_sunday.toFixed(2)),
      food_days, 
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
