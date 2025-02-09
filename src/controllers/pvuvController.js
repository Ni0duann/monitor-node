class PvuvController {
    constructor() {
        this.pvUvData = {
            pv1: 0,
            uv1: new Set(),
            pv2: 0,
            uv2: new Set(),
            pv3: 0,
            uv3: new Set(),
            pvTotal: 0,
            uvTotal: new Set()
        };
    }

    async updatePvUv(ctx) {
        try {
            const eventId = ctx.params.eventId;
            const ip = ctx.state.ip;

            switch (eventId) {
                case '1':
                    this.pvUvData.pv1++;
                    if (!this.pvUvData.uv1.has(ip)) {
                        this.pvUvData.uv1.add(ip);
                    }
                    break;
                case '2':
                    this.pvUvData.pv2++;
                    if (!this.pvUvData.uv2.has(ip)) {
                        this.pvUvData.uv2.add(ip);
                    }
                    break;
                case '3':
                    this.pvUvData.pv3++;
                    if (!this.pvUvData.uv3.has(ip)) {
                        this.pvUvData.uv3.add(ip);
                    }
                    break;
                default:
                    ctx.status = 400;
                    ctx.body = { error: '无效的事件ID' };
                    return;
            }

            // 更新总 PV 和 UV
            this.pvUvData.pvTotal++;
            if (!this.pvUvData.uvTotal.has(ip)) {
                this.pvUvData.uvTotal.add(ip);
            }

            ctx.status = 200;
            ctx.body = { success: true };
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: '更新数据失败' };
            console.error('更新失败:', err);
        }
    }

    async getPvUv(ctx) {
        try {
            const data = {
                pv1: this.pvUvData.pv1,
                uv1: this.pvUvData.uv1.size,
                pv2: this.pvUvData.pv2,
                uv2: this.pvUvData.uv2.size,
                pv3: this.pvUvData.pv3,
                uv3: this.pvUvData.uv3.size,
                pvTotal: this.pvUvData.pvTotal,
                uvTotal: this.pvUvData.uvTotal.size
            };
            ctx.body = { success: true, data };
        } catch (err) {
            ctx.status = 500;
            ctx.body = { error: '获取数据失败' };
            console.error('获取失败:', err);
        }
    }
}

module.exports = new PvuvController();