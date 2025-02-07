const Koa = require('koa');
const Router = require('koa-router');
const app = new Koa();
const router = new Router();

// 路由
router.get('/', async ctx => {
  ctx.body = 'Welcome to Koa.js!';
});

router.get('/about', async ctx => {
  ctx.body = 'This is a simple Koa.js application.';
});

// 使用路由中间件
app.use(router.routes()).use(router.allowedMethods());

// 启动服务器
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
