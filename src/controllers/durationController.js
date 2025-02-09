const influxService = require('../services/influxService');

class DurationController {
    async reportDuration(ctx) {
        try {
            const { pagePath, duration } = ctx.request.body;

            const point = new Point('page_duration')
                .tag('page_path', pagePath)
                .intField('duration', duration);

            await influxService.writePoints([point]);

            ctx.status = 201;
            ctx.body = { success: true };
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: '保存停留时长数据失败' };
            console.error('保存失败:', err);
        }
    }

    async getDurations(ctx) {
        try {
            const query = `
        from(bucket: "monitor data")
          |> range(start: -30d)
          |> filter(fn: (r) => r._measurement == "page_duration")
          |> group(columns: ["page_path"])
          |> mean(column: "_value")
      `;

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