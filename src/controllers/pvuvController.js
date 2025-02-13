const { transformData } = require('../utils/pvuvTransform');
const influxService = require('../services/influxService');

class PvuvController {
    async updatePvUv(ctx) {
        try {
            const pagePath = ctx.request.body.pagePath;
            const timestamp = new Date().toISOString();
            const addCount = ctx.request.body.addCount || 1;
            if (!pagePath) {
                ctx.status = 400;
                ctx.body = { error: '缺少必须参数pagePath！' };
                return;
            }
            const point = transformData({
                timestamp,
                pagePath,
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
            const { pagePath, dataType, os = 'All', device_type = 'All', browser = 'All', ip = 'All' } = ctx.query;
            const rangeTime = ctx.query.rangeTime || 7;

            if (!pagePath || !dataType || !['pv', 'uv'].includes(dataType)) {
                ctx.status = 400;
                ctx.body = { error: '参数错误！必须提供pagePath和有效的dataType。' };
                return;
            }

            // 构造基础过滤条件
            let filterConditions = `r._measurement == "flowData" and r.dataType == "pv"`;
            if (pagePath !== 'total') {
                filterConditions += ` and r.pagePath == "${pagePath}"`;
            }
            if (os !== 'All') filterConditions += ` and r.os == "${os}"`;
            if (device_type !== 'All') filterConditions += ` and r.device_type == "${device_type}"`;
            if (browser !== 'All') filterConditions += ` and r.browser == "${browser}"`;
            if (ip !== 'All') filterConditions += ` and r.ip == "${ip}"`;

            // 根据dataType构建查询语句
            let query;
            if (dataType === 'pv') {
                query = `
                    from(bucket: "monitor data")
                        |> range(start: -${rangeTime}d)
                        |> filter(fn: (r) => ${filterConditions})
                        |> sum(column: "_value")
                `;
            } else { // uv处理
                query = `
                    from(bucket: "monitor data")
                        |> range(start: -${rangeTime}d)
                        |> filter(fn: (r) => ${filterConditions})
                        |> distinct(column: "ip")
                        |> count()
                `;
            }

            const data = await influxService.queryData(query);
            const totalCount = data.reduce((acc, curr) => acc + (curr._value || 0), 0);

            ctx.body = { success: true, totalCount };
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: '查询流量数据失败' };
            console.error('查询流量数据错误:', err);
        }
    }
}

module.exports = new PvuvController();