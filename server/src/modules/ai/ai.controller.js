const aiService = require('./ai.service');

const getInsights = async (req, res, next) => {
  try {
    const { type = 'daily', date } = req.query;
    const insights = await aiService.generateInsights(req.userId, type, date);
    res.json({ status: 'success', data: insights });
  } catch (err) {
    next(err);
  }
};

module.exports = { getInsights };
