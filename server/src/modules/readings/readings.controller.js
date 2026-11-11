const readingsService = require('./readings.service');

const getAll = async (req, res, next) => {
  try {
    const { page, limit, date } = req.query;
    const data = await readingsService.getAll(req.userId, {
      page,
      limit,
      date,
    });
    res.json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const reading = await readingsService.create(req.userId, req.body);
    res.status(201).json({ status: 'success', data: reading });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const reading = await readingsService.update(
      req.userId,
      req.params.id,
      req.body
    );
    res.json({ status: 'success', data: reading });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await readingsService.remove(req.userId, req.params.id);
    res.json({ status: 'success', message: 'Reading deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create, update, remove };
