const { transformData } = require('../utils/durationTransform');
const influxService = require('../services/influxService');

class DurationController {
    async reportDuration(ctx) {
        try {
            const { pagePath, duration } = ctx.request.body;
            const point = transformData({ pagePath, duration }, ctx.state)

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
            const pagePath = ctx.query.pagePath;
            const rangeTime = ctx.query.rangeTime||7;
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
                  |> filter(fn: (r) => r._measurement == "Duration" and r.pagePath == "${pagePath}")
                  |> group(columns: ["pagePath"])
                  |> mean(column: "_value") // 直接计算 duration 字段的平均值
            `;

            const data = await influxService.queryData(query);

            ctx.body = { success: true, data };
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: '查询停留时长数据失败' };
            console.error('查询停留时长数据错误:', err);
        }
    }
}


module.exports = new DurationController();