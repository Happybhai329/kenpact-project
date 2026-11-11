const { validationResult } = require('express-validator');
const authService = require('./auth.service');

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const list = errors.array();
      return res.status(400).json({
        status: 'error',
        message: list[0].msg,
        errors: list,
      });
    }
    const data = await authService.register(req.body);
    res.status(201).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const list = errors.array();
      return res.status(400).json({
        status: 'error',
        message: list[0].msg,
        errors: list,
      });
    }
    const data = await authService.login(req.body);
    res.json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.userId);
    res.json({ status: 'success', data: { user } });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, me };
