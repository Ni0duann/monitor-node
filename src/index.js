require('module-alias/register');
require('dotenv').config();
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');
const cors = require('@koa/cors');
const { koaBody } = require('koa-body');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const { DeleteAPI } = require('@influxdata/influxdb-client-apis');
const { v4: uuidv4 } = require('uuid');
const UAParser = require('ua-parser-js');

// 初始化 Koa
const app = new Koa();
const router = new Router();

// InfluxDB 配置
const influxConfig = {
  url: 'http://127.0.0.1:8086',
  token: 'zcxZEZxqKFcStrfTXY2aOS9Lb_43Z8JYp2Cg1PUFPQk1Y8ElVgCtu2mz0O2hsqfPHfI49tyrNQp65ID1yGwY_g==',
  org: 'Dance',
  bucket: 'monitor data'
};

// 初始化InfluxDB客户端
const influxDB = new InfluxDB({
  url: influxConfig.url,
  token: influxConfig.token
});

//写查和删除数据的API分布在两个不同的Influx库中，需要分别导入.
const writeApi = influxDB.getWriteApi(influxConfig.org, influxConfig.bucket);
const queryApi = influxDB.getQueryApi(influxConfig.org);
const deleteApi = new DeleteAPI(influxDB);

// 设置仅允许列表白名单访问服务端和数据库
// const whitelist = ['http://example1.com', 'http://example2.com'];
// const corsOptions = {
//     origin: function (origin, callback) {
//         if (whitelist.indexOf(origin) !== -1 || !origin) {
//             callback(null, true);
//         } else {
//             callback(new Error('Not allowed by CORS'));
//         }
//     }
// };
// app.use(cors(corsOptions));

// 解决跨域问题，允许所有url的请求
app.use(cors());
app.use(koaBody());


// 中间件：获取用户信息 (浏览器、IP、时间、UUID)
app.use(async (ctx, next) => {
  // 生成 UUID
  ctx.state.uuid = uuidv4();
  // 获取 IP 地址（需处理代理情况）
  ctx.state.ip = ctx.headers['x-forwarded-for'] || ctx.ip || 'unknown';
  // 解析 User-Agent
  const ua = new UAParser(ctx.headers['user-agent']);
  ctx.state.userAgent = {
    browser: ua.getBrowser(),    // { name: 'Chrome', version: '116.0.0.0' }
    os: ua.getOS(),             // { name: 'Windows', version: '10' }
    device: ua.getDevice(),     // { type: 'desktop', vendor: undefined }
    engine: ua.getEngine()      // { name: 'Blink', version: '116.0.0.0' }
  };
  // 记录请求时间
  ctx.state.requestTime = new Date().toISOString();
  await next();
});

// 初始化数据库数据
async function initializeDatabase() {
  const points = [
    new Point('checkPointdata').intField('Page1PV', 0),
    new Point('checkPointdata').intField('Page1UV', 0),
    new Point('checkPointdata').intField('Page2PV', 0),
    new Point('checkPointdata').intField('Page2UV', 0),
    new Point('checkPointdata').intField('Page3PV', 0),
    new Point('checkPointdata').intField('Page3UV', 0),
    new Point('checkPointdata').intField('TotalPV', 0),
    new Point('checkPointdata').intField('TotalUV', 0)
  ];

  try {
    writeApi.writePoints(points);
    await writeApi.flush();
    console.log('✅Influx 埋点数据初始化成功！');
  } catch (err) {
    console.error('❌Influx 埋点数据初始化失败:', err);
  }
}

// 数据结构转换函数
function transformData(data, userInfo) {
  const points = [];
  const timestamp = new Date().getTime() * 1000000; // 纳秒时间戳

  // 添加用户信息 Tag
  const commonTags = {
    ip: userInfo.ip,
    uuid: userInfo.uuid,
    browser: userInfo.userAgent.browser.name,
    os: userInfo.userAgent.os.name,
    deviceType: userInfo.userAgent.device.type || 'desktop'
  };

  // 处理navigation数据
  const navPoint = new Point('navigation')
    .timestamp(timestamp)
    .tag('type', 'performance')
    // 添加用户信息 Tag
    .tag('ip', commonTags.ip)
    .tag('uuid', commonTags.uuid)
    .tag('browser', commonTags.browser)
    .tag('os', commonTags.os)
    .tag('device_type', commonTags.deviceType)

    //性能监控数据
    .intField('redirectCount', data.performance.navigation.redirectCount)
    .floatField('dnsLookupTime', data.performance.navigation.dnsLookupTime)
    .floatField('tcpConnectionTime', data.performance.navigation.tcpConnectionTime)
    .floatField('ttfb', data.performance.navigation.ttfb);
  points.push(navPoint);

  // 处理FCP数据
  data.performance.fcp.forEach((metric, index) => {
    const fcpPoint = new Point('fcp')
      .timestamp(timestamp)
      .tag('metric', metric.name)
      // 添加用户信息 Tag
      .tag('ip', commonTags.ip)
      .tag('uuid', commonTags.uuid)
      .tag('browser', commonTags.browser)
      .tag('os', commonTags.os)

      .tag('device_type', commonTags.deviceType)
      .floatField('startTime', metric.startTime);

    points.push(fcpPoint);
  });

  // 处理resources数据
  data.performance.resources.forEach(resource => {
    const resPoint = new Point('resource')
      .timestamp(timestamp)
      .tag('name', resource.name)
      .tag('type', resource.initiatorType)
      // 添加用户信息 Tag
      .tag('ip', commonTags.ip)
      .tag('uuid', commonTags.uuid)
      .tag('browser', commonTags.browser)
      .tag('os', commonTags.os)
      .tag('device_type', commonTags.deviceType)

      .floatField('duration', resource.duration)
      .floatField('startTime', resource.startTime)
      .floatField('responseEnd', resource.responseEnd);
    points.push(resPoint);
  });

  // 处理LCP数据
  if (data.performance.lcp?.lcp) {
    const lcp = data.performance.lcp.lcp;
    const lcpPoint = new Point('lcp')
      .timestamp(timestamp)

      // 添加用户信息 Tag
      .tag('ip', commonTags.ip)
      .tag('uuid', commonTags.uuid)
      .tag('browser', commonTags.browser)
      .tag('os', commonTags.os)

      .tag('device_type', commonTags.deviceType)
      .floatField('startTime', lcp.startTime)
      .floatField('renderTime', lcp.renderTime)
      .floatField('loadTime', lcp.loadTime)
      .intField('size', lcp.size)
      .tag('id', lcp.id)
      .tag('url', lcp.url);
    points.push(lcpPoint);
  };

  // 处理白屏数据
  if (data.performance.whiteScreenCount !== undefined) {
    const whiteScreenPoint = new Point('whiteScreen')
      .timestamp(timestamp)
      .intField('whiteScreenCount', data.performance.whiteScreenCount);
    points.push(whiteScreenPoint);
  }

  return points;
}

// 性能监控数据上报路由
router.post('/api/report', async (ctx) => {
  try {
    const { performance, errors } = ctx.request.body;

    if (!performance?.navigation) {
      ctx.status = 400;
      ctx.body = { error: '性能监控数据丢失！' };
      return;
    }

    // 获取中间件注入的用户信息
    const userInfo = {
      ip: ctx.state.ip,
      uuid: ctx.state.uuid,
      userAgent: ctx.state.userAgent,
      requestTime: ctx.state.requestTime
    };

    // 转换数据结构
    const points = transformData({ performance, errors }, userInfo);
    // 写入InfluxDB
    writeApi.writePoints(points);
    await writeApi.flush();
    ctx.status = 201;
    ctx.body = { success: true };

  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
    console.error('上报失败:', err);
  }
});

// 前端获取数据库的性能数据路由
router.get('/api/performance', async (ctx) => {
  try {
    const limit = parseInt(ctx.query.limit) || 100;
    const fluxQuery = `
      from(bucket: "${influxConfig.bucket}")
        |> range(start: -30d)
        |> filter(fn: (r) => r._measurement == "navigation")
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: ${limit})
    `;

    const data = await new Promise((resolve, reject) => {
      const result = [];
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          const obj = tableMeta.toObject(row);

          result.push({
            timestamp: obj._time,
            [obj._field]: obj._value
          });
        },
        error: reject,
        complete() { resolve(result); }
      });
    });

    ctx.body = { success: true, data };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch data' };
    console.error('查询失败:', err);
  }
});

// 处理页面浏览事件的路由
router.post('/api/page-view', async (ctx) => {
  try {
    const { page_path, browser, os, device_type, timestamp } = ctx.request.body;
    const userInfo = {
      ip: ctx.state.ip,
      uuid: ctx.state.uuid,
    };

    const point = new Point('page_view')
      .tag('page_path', page_path)
      .tag('browser', browser)
      .tag('os', os)
      .tag('device_type', device_type)
      .tag('ip', userInfo.ip)
      .tag('uuid', userInfo.uuid)
      .stringField('user_id', userInfo.uuid)
      .timestamp(new Date(timestamp));

    writeApi.writePoint(point);
    await writeApi.flush();

    ctx.status = 201;
    ctx.body = { success: true };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: '上报失败' };
    console.error('页面浏览记录失败:', err);
  }
});

// // 新增路由：将白屏计数加 1
// router.post('/api/incrementWhiteScreenCount', async (ctx) => {
//     try {
//         // 先查询当前的白屏计数
//         const fluxQuery = `
//             from(bucket: "${influxConfig.bucket}")
//             |> range(start: -30d)
//             |> filter(fn: (r) => r._measurement == "whiteScreen")
//             |> sum(column: "_value")
//         `;

//         const currentCountResult = await new Promise((resolve, reject) => {
//             const result = [];
//             queryApi.queryRows(fluxQuery, {
//                 next(row, tableMeta) {
//                     const obj = tableMeta.toObject(row);
//                     result.push(obj._value);
//                 },
//                 error: reject,
//                 complete() { resolve(result); }
//             });
//         });

//         let currentCount = 0;
//         if (currentCountResult.length > 0) {
//             currentCount = currentCountResult[0];
//         }

//         // 将计数加 1
//         const newCount = currentCount + 1;

//         const timestamp = new Date().getTime() * 1000000; // 纳秒时间戳
//         const whiteScreenPoint = new Point('whiteScreen')
//             .timestamp(timestamp)
//             .intField('count', newCount);

//         // 写入InfluxDB
//         writeApi.writePoint(whiteScreenPoint);
//         await writeApi.flush();

//         ctx.status = 200;
//         ctx.body = { success: true };
//     } catch (err) {
//         ctx.status = 500;
//         ctx.body = { error: 'Failed to increment white screen count' };
//         console.error('Increment white screen count failed:', err);
//     }
// });

// 删除性能数据路由
router.delete('/api/performance/:timestamp', async (ctx) => {
  try {
    const timestamp = ctx.params.timestamp;
    console.log('nodetimestamp', timestamp);

    // 将时间戳转换为 InfluxDB 可接受的格式
    const start = new Date(timestamp).toISOString();
    const stop = new Date(new Date(timestamp).getTime() + 1).toISOString();

    // 使用 DeleteAPI 实例删除数据
    await deleteApi.postDelete({
      org: influxConfig.org,
      bucket: influxConfig.bucket,
      body: {
        start,
        stop,
        predicate: `_measurement="navigation"`
      }
    });

    ctx.status = 200;
    ctx.body = { success: true };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: '删除数据失败' };
    console.error('删除失败:', err);
  }
});


// 注册路由
app.use(router.routes());
app.use(router.allowedMethods());

// 启动服务
const PORT = process.env.PORT || 5501;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});