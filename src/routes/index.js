const Router = require('koa-router');

const performanceRoutes = require('./performance');
const pvuvRoutes = require('./pvuv');
const durationRoutes = require('./duration');
const whiteScreenRoutes = require('./whiteScreen');

const router = new Router();

// 聚合所有路由
router.use(performanceRoutes.routes());
router.use(pvuvRoutes.routes());
router.use(durationRoutes.routes());
router.use(whiteScreenRoutes.routes());

module.exports = router;