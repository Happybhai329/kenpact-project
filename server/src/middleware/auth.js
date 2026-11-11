const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Not authenticated', 401));
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return next(new AppError('Invalid or expired token', 401));
  }
};
module.exports = auth;
