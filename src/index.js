require('module-alias/register');
require('dotenv').config();
const Koa = require('koa');
const cors = require('@koa/cors');
const { koaBody } = require('koa-body');

// 加载中间件
const contextMiddleware = require('./middlewares/context');

// 加载路由
const router = require('./routes');

const app = new Koa();

// 应用中间件
app.use(cors());
app.use(koaBody());
app.use(contextMiddleware);

// 应用路由
app.use(router.routes()).use(router.allowedMethods());

// 启动服务器
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});