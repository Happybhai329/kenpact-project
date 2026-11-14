const router = require('express').Router();
const auth = require('../../middleware/auth');
const { getInsights } = require('./ai.controller');

router.use(auth);
router.get('/insights', getInsights);

module.exports = router;
