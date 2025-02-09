require('module-alias/register');
require('dotenv').config();
const Koa = require('koa');
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

const writeApi = influxDB.getWriteApi(influxConfig.org, influxConfig.bucket);
const queryApi = influxDB.getQueryApi(influxConfig.org);
const deleteApi = new DeleteAPI(influxDB);

// 跨域配置
app.use(cors());
app.use(koaBody());

// 中间件：注入用户信息
app.use(async (ctx, next) => {
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
});

// 数据结构转换函数
function transformData(data, userInfo) {
  const points = [];
  const timestamp = new Date().getTime() * 1000000;

  // 公共标签
  const commonTags = {
    ip: userInfo.ip,
    uuid: userInfo.uuid,
    browser: userInfo.userAgent.browser.name,
    os: userInfo.userAgent.os.name,
    deviceType: userInfo.userAgent.device.type || 'desktop'
  };

  //-----------------------------
  // 核心性能指标（TTFB、LCP、FCP）
  //-----------------------------
  const perfPoint = new Point('web_perf')
    .timestamp(timestamp)
    .tag('type', 'performance')
    .tag('ip', commonTags.ip)
    .tag('uuid', commonTags.uuid)
    .tag('browser', commonTags.browser)
    .tag('os', commonTags.os)
    .tag('device_type', commonTags.deviceType)
    .floatField('ttfb', data.performance.ttfb)
    .floatField('lcp_render_time', data.performance.lcpRenderTime)
    .floatField('fcp_start_time', data.performance.fcpStartTime);

  points.push(perfPoint);

  //-----------------------------
  // 白屏计数
  //-----------------------------
  if (data.performance.whiteScreenCount !== undefined) {
    const whiteScreenPoint = new Point('web_perf')
      .timestamp(timestamp)
      .tag('type', 'white_screen')
      .tag('ip', commonTags.ip)
      .tag('uuid', commonTags.uuid)
      .tag('browser', commonTags.browser)
      .tag('os', commonTags.os)
      .tag('device_type', commonTags.deviceType)
      .intField('count', data.performance.whiteScreenCount);
    points.push(whiteScreenPoint);
  }

  return points;
}

// 性能数据上报路由
router.post('/api/report', async (ctx) => {
  try {
    const { performance, errors } = ctx.request.body;

    // 校验必要字段
    if (!performance?.ttfb || !performance?.lcpRenderTime || !performance?.fcpStartTime) {
      ctx.status = 400;
      ctx.body = { error: '缺少关键性能指标（TTFB/LCP/FCP）！' };
      return;
    }

    // 获取用户信息
    const userInfo = {
      ip: ctx.state.ip,
      uuid: ctx.state.uuid,
      userAgent: ctx.state.userAgent,
      requestTime: ctx.state.requestTime
    };

    // 转换并写入数据
    const points = transformData({ performance, errors }, userInfo);
    writeApi.writePoints(points);
    await writeApi.flush();
    ctx.status = 201;
    ctx.body = { success: true };

  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: '服务器内部错误' };
    console.error('上报失败:', err);
  }
});

// 获取性能数据路由
router.get('/api/performance', async (ctx) => {
  try {
    const limit = parseInt(ctx.query.limit) || 100;
    const query = `
      from(bucket: "${influxConfig.bucket}")
        |> range(start: -30d)
        |> filter(fn: (r) => r._measurement == "web_perf")
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: ${limit})
    `;

    const data = await new Promise((resolve, reject) => {
      const result = [];
      queryApi.queryRows(query, {
        next(row, tableMeta) {
          const obj = tableMeta.toObject(row);
          result.push({
            timestamp: obj._time,
            type: obj.type,       // 区分 performance/white_screen
            field: obj._field,    // 字段名（如 ttfb）
            value: obj._value,    // 数值
            device: obj.device_type,
            browser: obj.browser
          });
        },
        error: reject,
        complete() { resolve(result); }
      });
    });

    ctx.body = { success: true, data };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: '查询失败' };
    console.error('查询错误:', err);
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

// 初始化 pv 和 uv 数据
const pvUvData = {
  pv1: 0,
  uv1: new Set(),
  pv2: 0,
  uv2: new Set(),
  pv3: 0,
  uv3: new Set(),
  pvTotal: 0,
  uvTotal: new Set()
};

// 更新 pv 和 uv 数据的路由
router.post('/api/update-pv-uv/:eventId', async (ctx) => {
  try {
    const eventId = ctx.params.eventId;
    const ip = ctx.state.ip;
    switch (eventId) {
      case '1':
        pvUvData.pv1++;
        if (!pvUvData.uv1.has(ip)) {
          pvUvData.uv1.add(ip);
        }
        break;
      case '2':
        pvUvData.pv2++;
        if (!pvUvData.uv2.has(ip)) {
          pvUvData.uv2.add(ip);
        }
        break;
      case '3':
        pvUvData.pv3++;
        if (!pvUvData.uv3.has(ip)) {
          pvUvData.uv3.add(ip);
        }
        break;
      default:
        ctx.status = 400;
        ctx.body = { error: '无效的事件ID' };
        return;
    }
    // 更新总 pv 和 uv
    pvUvData.pvTotal++;
    if (!pvUvData.uvTotal.has(ip)) {
      pvUvData.uvTotal.add(ip);
    }
    ctx.status = 200;
    ctx.body = { success: true };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: '更新数据失败' };
    console.error('更新失败:', err);
  }
});

// 获取 pv 和 uv 数据的路由
router.get('/api/get-pv-uv', async (ctx) => {
  try {
    const data = {
      pv1: pvUvData.pv1,
      uv1: pvUvData.uv1.size,
      pv2: pvUvData.pv2,
      uv2: pvUvData.uv2.size,
      pv3: pvUvData.pv3,
      uv3: pvUvData.uv3.size,
      pvTotal: pvUvData.pvTotal,
      uvTotal: pvUvData.uvTotal.size
    };
    ctx.body = { success: true, data };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: '获取数据失败' };
    console.error('获取失败:', err);
  }
});

// 接收test页面发送来的停留时长数据的路由
router.post('/api/report-duration', async (ctx) => {
  try {
    const { pagePath, duration } = ctx.request.body;
    // 创建 InfluxDB 数据点
    const point = new Point('page_duration')
      .tag('page_path', pagePath)
      .intField('duration', duration);
    // 写入 InfluxDB
    writeApi.writePoint(point);
    await writeApi.flush();
    ctx.status = 201;
    ctx.body = { success: true };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: '保存停留时长数据失败' };
    console.error('保存失败:', err);
  }
});

// web数据平台页面获取停留时长数据的路由
router.get('/api/get-page-durations', async (ctx) => {
  try {
    const query = `
            from(bucket: "${influxConfig.bucket}")
                |> range(start: -30d)
                |> filter(fn: (r) => r._measurement == "page_duration")
                |> group(columns: ["page_path"])
                |> mean(column: "_value")
        `;
    const data = await new Promise((resolve, reject) => {
      const result = [];
      queryApi.queryRows(query, {
        next(row, tableMeta) {
          const obj = tableMeta.toObject(row);
          result.push({
            pagePath: obj.page_path,
            averageDuration: obj._value
          });
        },
        error: reject,
        complete() { resolve(result); }
      });
    });
    ctx.body = { success: true, data };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: '查询停留时长数据失败' };
    console.error('查询错误:', err);
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