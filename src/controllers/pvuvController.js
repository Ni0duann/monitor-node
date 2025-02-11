// class PvuvController {
//     constructor() {
//         this.pvUvData = {
//             pv1: 0,
//             uv1: new Set(),
//             pv2: 0,
//             uv2: new Set(),
//             pv3: 0,
//             uv3: new Set(),
//             pvTotal: 0,
//             uvTotal: new Set()
//         };
//     }

//     async updatePvUv(ctx) {
//         try {
//             const eventId = ctx.params.eventId;
//             const ip = ctx.state.ip;

//             switch (eventId) {
//                 case '1':
//                     this.pvUvData.pv1++;
//                     if (!this.pvUvData.uv1.has(ip)) {
//                         this.pvUvData.uv1.add(ip);
//                     }
//                     break;
//                 case '2':
//                     this.pvUvData.pv2++;
//                     if (!this.pvUvData.uv2.has(ip)) {
//                         this.pvUvData.uv2.add(ip);
//                     }
//                     break;
//                 case '3':
//                     this.pvUvData.pv3++;
//                     if (!this.pvUvData.uv3.has(ip)) {
//                         this.pvUvData.uv3.add(ip);
//                     }
//                     break;
//                 default:
//                     ctx.status = 400;
//                     ctx.body = { error: '无效的事件ID' };
//                     return;
//             }

//             // 更新总 PV 和 UV
//             this.pvUvData.pvTotal++;
//             if (!this.pvUvData.uvTotal.has(ip)) {
//                 this.pvUvData.uvTotal.add(ip);
//             }

//             ctx.status = 200;
//             ctx.body = { success: true };
//         } catch (err) {
//             ctx.status = 500;
//             ctx.body = { error: '更新数据失败' };
//             console.error('更新失败:', err);
//         }
//     }

//     async getPvUv(ctx) {
//         try {
//             const data = {
//                 pv1: this.pvUvData.pv1,
//                 uv1: this.pvUvData.uv1.size,
//                 pv2: this.pvUvData.pv2,
//                 uv2: this.pvUvData.uv2.size,
//                 pv3: this.pvUvData.pv3,
//                 uv3: this.pvUvData.uv3.size,
//                 pvTotal: this.pvUvData.pvTotal,
//                 uvTotal: this.pvUvData.uvTotal.size
//             };
//             ctx.body = { success: true, data };
//         } catch (err) {
//             ctx.status = 500;
//             ctx.body = { error: '获取数据失败' };
//             console.error('获取失败:', err);
//         }
//     }
// }

// module.exports = new PvuvController();


const { transformData } = require('../utils/pvuvTransform');
const influxService = require('../services/influxService');

class PvuvController {
    async updatePvUv(ctx) {
        try {
            const { pagePath, datatype } = ctx.request.body;
            // console.log('ctx.request.body', ctx.request.body)
            const timestamp = new Date().toISOString();
            const addCount = ctx.request.body.addCount || 1;

console.log({timestamp,pagePath,datatype,addCount})

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
                rangeTime,
                // os = 'Windows',
                // device_type = 'desktop',
                // browser = 'Chrome',
                // ip = '::1'
                os = 'All',
                device_type = 'All',
                browser = 'All',
                ip = 'All'
            } = ctx.request.body;
            console.log('ctx.request.body', ctx.request.body)
            // console.log('ctx.request.body',ctx.request.body)
            if ( !pagePath || !datatype || !rangeTime || isNaN(parseInt(rangeTime)) || parseInt(rangeTime) <= 0) {
                ctx.status = 400;
                ctx.body = { error: '缺少必要流量数据参数或参数格式错误！' };
                return;
            }
            let filterConditions = `r._measurement == "flowData" and r.pagePath == "${pagePath}" and r.datatype == "${datatype}"`;
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
                  |> sum(column: "addCount")
            `;
            const data = await influxService.queryData(query);
            console.log('data',data)
            const totalCount = data.length > 0 ? data[0]._value : 0;
            ctx.body = { success: true, data: { totalCount } };
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: '查询流量数据失败' };
            console.error('查询流量数据错误:', err);
        }
    }
}


module.exports = new PvuvController();