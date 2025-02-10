const { v4: uuidv4 } = require('uuid');
const UAParser = require('ua-parser-js');

//中间件，每一个路由都会调用这个函数
module.exports = async (ctx, next) => {
    ctx.state.uuid = uuidv4();
    ctx.state.ip = ctx.headers['x-forwarded-for'] || ctx.ip || 'unknown';
    const ua = new UAParser(ctx.headers['user-agent']);
    ctx.state.userAgent = {
        browser: ua.getBrowser(),
        os: ua.getOS(),
        device: ua.getDevice(),
        engine: ua.getEngine()
    };
    ctx.state.requestTime = new Date().toISOString();
    await next();
};