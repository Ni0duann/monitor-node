const { transformData } = require('../utils/duraTransform');
const influxService = require('../services/influxService');

class DurationController {
    async reportDuration(ctx) {
        try {
            const { pagePath, duration } = ctx.request.body;

            const point = transformData({ pagePath, duration }, ctx.state)
            // const point = new Point('pageDuration')
            //     .tag('pagePath', pagePath)
            //     .intField('duration', duration);

            await influxService.writePoints([point]);

            ctx.status = 201;
            ctx.body = { success: true };
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: '服务器内部错误,上传停留时长数据失败' };
            console.error('保存停留时长数据失败:', err);
        }
    }

    async getDurations(ctx) {
        try {
            // const { pagePath, rangeTime } = ctx.request.body;
            const { pagePath, rangeTime } = ctx.query;
            // 检查参数是否有效
            if (!pagePath || !rangeTime || isNaN(parseInt(rangeTime)) || parseInt(rangeTime) <= 0) {
                ctx.status = 400;
                ctx.body = { error: '缺少必要参数或参数格式错误！' };
                return;
            }
            // 构建带有 pagePath 过滤条件的查询语句
            const query = `
                from(bucket: "monitor data")
                  |> range(start: -${parseInt(rangeTime)}d)
                  |> filter(fn: (r) => r._measurement == "pageDuration" and r.pagePath == "${pagePath}")
                  |> group(columns: ["pagePath"])
                  |> mean(column: "duration") // 直接计算 duration 字段的平均值
            `;
            console.log('执行的查询语句:', query);
            const data = await influxService.queryData(query);
            ctx.body = { success: true, data };
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: '查询停留时长数据失败' };
            console.error('查询错误:', err);
        }
    }
}


module.exports = new DurationController();