const Router = require('koa-router');
const durationController = require('../controllers/durationController');

const router = new Router({ prefix: '/api' });

router.post('/pushDuration', durationController.reportDuration);
router.get('/getDurations', durationController.getDurations);

module.exports = router;