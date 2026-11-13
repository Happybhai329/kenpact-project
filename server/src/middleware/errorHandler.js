const errorHandler = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid JSON request body',
    });
  }

  const statusCode = err.statusCode || 500;
  if (statusCode === 500 && process.env.NODE_ENV !== 'test') {
    console.error('Unhandled error:', err);
  }

  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal server error',
  });
};

module.exports = errorHandler;
