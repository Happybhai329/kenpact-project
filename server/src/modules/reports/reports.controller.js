const reportsService = require('./reports.service');

const daily = async (req, res, next) => {
  try {
    const data = await reportsService.daily(req.userId, req.query.date);
    res.json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
};

const monthToDate = async (req, res, next) => {
  try {
    const data = await reportsService.monthToDate(req.userId, req.query.date);
    res.json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
};

const monthly = async (req, res, next) => {
  try {
    const data = await reportsService.monthly(req.userId, req.query.date);
    res.json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
};

module.exports = { daily, monthToDate, monthly };
