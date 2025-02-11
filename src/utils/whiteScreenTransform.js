const { Point } = require('@influxdata/influxdb-client');
const { generateCommonTags } = require('../config/commoninfo');

function transformData(data, userInfo) {
    const commonTags = generateCommonTags(userInfo);
    const timestamp = new Date().getTime() * 1000000;

    // 将收集到的数据插入 WhiteScreen 这张测量表
    const whiteScreenPoint = new Point('WhiteScreen')
        .timestamp(timestamp)
        .tag('pageUrl', data.pageUrl)
        .intField('addCount', data.addCount)

        .tag('uuid', commonTags.uuid)
        .tag('ip', commonTags.ip || 'Unknown')
        .tag('browser', commonTags.browser || 'Unknown')
        .tag('os', commonTags.os || 'Unknown')
        .tag('device_type', commonTags.deviceType || 'Unknown');

    return whiteScreenPoint;
}

module.exports = { transformData };