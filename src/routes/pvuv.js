//定义与pvuv有关的获取或发送数据路由
const Router = require('koa-router');
const pvuvController = require('../controllers/pvuvController');

const router = new Router({ prefix: '/api' });

router.post('/update-pv-uv/:eventId', pvuvController.updatePvUv);
router.get('/get-pv-uv', pvuvController.getPvUv);

module.exports = router;