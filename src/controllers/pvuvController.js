const { transformData } = require('../utils/pvuvTransform');
const influxService = require('../services/influxService');

class PvuvController {
    async updatePvUv(ctx) {
        try {
            const { pagePath, datatype } = ctx.query;
            // console.log('ctx.request.body', ctx.request.body)
            const timestamp = new Date().toISOString();
            const addCount = ctx.request.body.addCount || 1;

            const point = transformData({
                timestamp,
                pagePath,
                datatype,
                addCount
            }, ctx.state);
            console.log('写入的数据点:', point); // 输出写入的数据点
            await influxService.writePoints([point]);

            ctx.status = 201;
            ctx.body = { success: true };
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: '更新流量数据失败' };
            console.error('更新流量失败:', err);
        }
    }

    //可以根据
    async getPvUv(ctx) {
        try {
            const {
                pagePath,
                datatype,
                // os = 'Windows',
                // device_type = 'desktop',
                // browser = 'Chrome',
                // ip = '::1'
                os = 'All',
                device_type = 'All',
                browser = 'All',
                ip = 'All'
            } = ctx.query; 
            const rangeTime = ctx.query.rangeTime||7
            console.log('ctx.query', ctx.query)
            // console.log('ctx.request.body',ctx.request.body)
            if ( !pagePath || !datatype) {
                ctx.status = 400;
                ctx.body = { error: '缺少必要流量数据参数或参数格式错误！' };
                return;
            }
            let filterConditions = `r._measurement == "flowData" and r.datatype == "${datatype}"`;
            // 如果 pagePath 不为 'total'，才添加 pagePath 的筛选条件
            if (pagePath !== 'total') {
                filterConditions += ` and r.pagePath == "${pagePath}"`;
            }
            if (os !== 'All') {
                filterConditions += ` and r.os == "${os}"`;
            }
            if (device_type !== 'All') {
                filterConditions += ` and r.device_type == "${device_type}"`;
            }
            if (browser !== 'All') {
                filterConditions += ` and r.browser == "${browser}"`;
            }
            if (ip !== 'All') {
                filterConditions += ` and r.ip == "${ip}"`;
            }
            const query = `
                from(bucket: "monitor data")
                  |> range(start: -${rangeTime}d)
                  |> filter(fn: (r) => ${filterConditions})
                  |> sum(column: "_value")
            `;
            const data = await influxService.queryData(query);
            // console.log('data',data)
            // console.log('data.length', data.length)
            const totalCount = data.length > 0 ? data.length : 0;
            ctx.body = { success: true, totalCount };
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: '查询流量数据失败' };
            console.error('查询流量数据错误:', err);
        }
    }
}

module.exports = new PvuvController();