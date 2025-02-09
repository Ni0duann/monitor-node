const Router = require('koa-router');
const performanceRoutes = require('./performance');
// const pageViewRoutes = require('./pageView');
const pvuvRoutes = require('./pvuv');
const durationRoutes = require('./duration');

const router = new Router();

// 聚合所有路由
router.use(performanceRoutes.routes());
// router.use(pageViewRoutes.routes());
router.use(pvuvRoutes.routes());
router.use(durationRoutes.routes());

module.exports = router;