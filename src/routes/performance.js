const Router = require('koa-router');
const perfController = require('../controllers/perfController');

const router = new Router({ prefix: '/api' });

router.post('/report', perfController.report);
router.get('/performance', perfController.getPerformance);
router.delete('/performance/:timestamp', perfController.deletePerformance);

module.exports = router;