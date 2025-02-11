const Router = require('koa-router');
const whiteScreenController = require('../controllers/whiteScreenController');

const router = new Router({ prefix: '/api' });

router.post('/push_WS', whiteScreenController.reportWhiteScreen);
router.get('/get_WS', whiteScreenController.getWhiteScreen);

module.exports = router;