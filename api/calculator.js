function timeToMins(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function roundOTHours(rawMinutes) {
  if (rawMinutes <= 0) return 0;
  const fullHours = Math.floor(rawMinutes / 60);
  const remainder = rawMinutes % 60;
  let extra = 0;
  if (remainder >= 45) extra = 1;
  else if (remainder >= 30) extra = 0.5;
  return fullHours + extra;
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function calculateOT({ date, checkin_time, checkout_time, is_sunday, is_different_day, morning_checkin, salary }) {
  const d = new Date(date + 'T00:00:00');
  const days = daysInMonth(d.getFullYear(), d.getMonth() + 1);
  const perDayVal = salary / days;

  const OT_RATE     = 80;
  const FOOD_CHARGE = 150;
  const SHIFT_END   = 19 * 60;       // 7:00 PM
  const FOOD_TIME   = 22 * 60;       // 10:00 PM
  const MIDNIGHT    = 23 * 60 + 50;  // 11:50 PM
  const EARLY_CUT   = 7 * 60 + 55;   // 7:55 AM

  let morning_ot = 0, morning_food = 0, evening_ot = 0, evening_food = 0;
  let full_day_triggered = false, full_day_val = 0, total_ot = 0;

  // Sunday ON → full day
  if (is_sunday) {
    full_day_triggered = true;
    full_day_val = parseFloat(perDayVal.toFixed(2));
    return { morning_ot, morning_food, evening_ot, evening_food, full_day_triggered, full_day_val, total_ot: full_day_val, per_day_val: full_day_val, month_days: days };
  }

  const checkoutMins = timeToMins(checkout_time);

  // After 11:50 PM → full day
  if (checkoutMins !== null && checkoutMins > MIDNIGHT) {
    full_day_triggered = true;
    full_day_val = parseFloat(perDayVal.toFixed(2));
    return { morning_ot, morning_food, evening_ot, evening_food, full_day_triggered, full_day_val, total_ot: full_day_val, per_day_val: full_day_val, month_days: days };
  }

  // Early morning check-in
  const effectiveCheckin = is_different_day ? morning_checkin : checkin_time;
  const checkinMins = timeToMins(effectiveCheckin);
  if (checkinMins !== null && checkinMins < EARLY_CUT) {
    morning_ot   = OT_RATE;      // fixed 1hr: 8-9 AM
    morning_food = FOOD_CHARGE;  // ₹150
  }

  // Evening OT
  if (checkoutMins !== null && checkoutMins > SHIFT_END) {
    const otHours = roundOTHours(checkoutMins - SHIFT_END);
    evening_ot = OT_RATE * otHours;
    if (checkoutMins > FOOD_TIME) evening_food = FOOD_CHARGE;
  }

  total_ot = morning_ot + morning_food + evening_ot + evening_food;

  return {
    morning_ot,
    morning_food,
    evening_ot: parseFloat(evening_ot.toFixed(2)),
    evening_food,
    full_day_triggered,
    full_day_val,
    total_ot: parseFloat(total_ot.toFixed(2)),
    per_day_val: parseFloat(perDayVal.toFixed(2)),
    month_days: days,
  };
}

module.exports = { calculateOT };
