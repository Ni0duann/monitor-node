//定义与pvuv有关的获取或发送数据路由
const Router = require('koa-router');
const pvuvController = require('../controllers/pvuvController');

const router = new Router({ prefix: '/api' });

router.post('/push_flowData', pvuvController.updatePvUv);
router.get('/get_flowData', pvuvController.getPvUv);
// router.post('/get_flowData', pvuvController.getPvUv); // 主要改动点

module.exports = router;