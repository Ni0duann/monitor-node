const { Point } = require('@influxdata/influxdb-client');
const { generateCommonTags } =require('../config/commoninfo')

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
        .floatField('fcp_start_time', data.performance.fcpStartTime);

    points.push(perfPoint);

    if (data.performance.whiteScreenCount !== undefined) {
        const whiteScreenPoint = new Point('performanceData')
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

module.exports = { transformData };