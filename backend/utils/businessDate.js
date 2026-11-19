const BUSINESS_TIMEZONE = "Asia/Kolkata";
function businessDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type).value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
function claimDateRange(day = businessDate()) {
  const start = new Date(`${day}T00:00:00.000Z`);
  return { start, end: new Date(start.getTime() + 86400000) };
}
module.exports = { BUSINESS_TIMEZONE, businessDate, claimDateRange };
