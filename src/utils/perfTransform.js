const { Point } = require('@influxdata/influxdb-client');
const { generateCommonTags } = require('../config/commoninfo')

function transformData(data, userInfo) {
    const points = [];
    const timestamp = new Date().getTime() * 1000000;
    const commonTags = generateCommonTags(userInfo);

    const perfPoint = new Point('performanceData')
        .timestamp(timestamp)
        .tag('type', 'performance')
        .tag('ip', commonTags.ip)
        .tag('uuid', commonTags.uuid)
        .tag('browser', commonTags.browser)
        .tag('os', commonTags.os)
        .tag('device_type', commonTags.deviceType)
        .floatField('ttfb', data.performance.ttfb)
        .floatField('lcp_render_time', data.performance.lcpRenderTime)
        .floatField('fcp_start_time', data.performance.fcp) // 修改为使用 fcp 字段
        .floatField('fp', data.performance.fp) // 添加对 fp 字段的处理
        .intField('redirect_count', data.performance.redirectCount); // 添加对 redirectCount 字段的处理

    points.push(perfPoint);

    return points;
}

module.exports = { transformData };