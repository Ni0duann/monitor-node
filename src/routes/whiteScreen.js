const Router = require('koa-router');
const whiteScreenController = require('../controllers/whiteScreenController');

const router = new Router({ prefix: '/api' });

router.post('/push/WhiteScreen', whiteScreenController.reportWhiteScreen);
router.get('/get/WhiteScreen', whiteScreenController.getWhiteScreen);

module.exports = router;