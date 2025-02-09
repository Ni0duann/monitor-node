const Router = require('koa-router');
const durationController = require('../controllers/durationController');

const router = new Router({ prefix: '/api' });

router.post('/report-duration', durationController.reportDuration);
router.get('/get-page-durations', durationController.getDurations);

module.exports = router;