const Router = require('koa-router');
const durationController = require('../controllers/durationController');

const router = new Router({ prefix: '/api' });

router.post('/push_WS', durationController.reportWhiteScreen);
router.get('/get_WS', durationController.getWhiteScreen);

module.exports = router;