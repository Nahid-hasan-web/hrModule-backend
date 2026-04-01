// utility/getFridaysOfMonth.js
const pad2 = (n) => String(n).padStart(2, "0");

const getFridaysOfMonth = (year, month) => {
  const fridays = [];
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate(); // month: 1-12

  for (let d = 1; d <= lastDay; d += 1) {
    const dt = new Date(Date.UTC(year, month - 1, d));
    if (dt.getUTCDay() === 5) {
      fridays.push(`${year}-${pad2(month)}-${pad2(d)}`);
    }
  }

  return fridays;
};

module.exports = { getFridaysOfMonth };
