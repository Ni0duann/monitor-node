const Router = require('koa-router');
const perfController = require('../controllers/perfController');

const router = new Router({ prefix: '/api' });

router.post('/push_pref', perfController.pushPerformance);
router.get('/get_pref', perfController.getPerformance);
router.delete('/delete_pref/:timestamp', perfController.deletePerformance);

module.exports = router;