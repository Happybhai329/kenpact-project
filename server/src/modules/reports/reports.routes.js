const router = require('express').Router();
const auth = require('../../middleware/auth');
const { daily, monthToDate, monthly } = require('./reports.controller');

router.use(auth);
router.get('/daily', daily);
router.get('/month-to-date', monthToDate);
router.get('/monthly', monthly);

module.exports = router;
