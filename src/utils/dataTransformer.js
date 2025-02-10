const { Point } = require('@influxdata/influxdb-client');
const commonTags =require('../config/commoninfo')

function transformData(data, userInfo) {
    const points = [];
    const timestamp = new Date().getTime() * 1000000;

    // const commonTags = {
    //     ip: userInfo.ip,
    //     uuid: userInfo.uuid,
    //     browser: userInfo.userAgent.browser.name,
    //     os: userInfo.userAgent.os.name,
    //     deviceType: userInfo.userAgent.device.type || 'desktop'
    // };

    const perfPoint = new Point('web_perf')
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
        const whiteScreenPoint = new Point('web_perf')
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