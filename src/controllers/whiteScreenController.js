const { transformData } = require('../utils/whiteScreenTransform');
const influxService = require('../services/influxService');

class WhiteScreenController {
    async reportWhiteScreen(ctx) {
        try {
            const { pageUrl } = ctx.request.body;
            const addCount = 1; 
            const point = transformData({ pageUrl}, ctx.state);

            await influxService.writePoints([point]);
            ctx.status = 201;
            ctx.body = { success: true };
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: '服务器内部错误,上传白屏时长数据失败' };
            console.error('保存白屏时长数据失败:', err);
        }
    }

    async getWhiteScreen(ctx) {
        try {
            const { pageUrl, rangeTime } = ctx.query;
            // 检查参数是否有效
            if (!pageUrl || !rangeTime || isNaN(parseInt(rangeTime)) || parseInt(rangeTime) <= 0) {
                ctx.status = 400;
                ctx.body = { error: '缺少必要白屏查询参数或参数格式错误！' };
                return;
            }
            // 构建带有 pageUrl 过滤条件的查询语句
            const query = `
                from(bucket: "monitor data")
                  |> range(start: -${parseInt(rangeTime)}d)
                  |> filter(fn: (r) => r._measurement == "WhiteScreen" and r.pageUrl == "${pageUrl}")
                  |> group(columns: ["pageUrl"])
                  |> mean(column: "_value") // 直接计算白屏时长字段的平均值
            `;
            console.log('执行的查询语句:', query);
            const data = await influxService.queryData(query);
            console.log('data:', data);
            ctx.body = { success: true, data };
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: '查询白屏时长数据失败' };
            console.error('查询白屏时长数据错误:', err);
        }
    }
}

module.exports = new WhiteScreenController();