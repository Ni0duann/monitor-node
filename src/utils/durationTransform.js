// utils/pvuvTransform.js
const { Point } = require('@influxdata/influxdb-client');
const { generateCommonTags } = require('../config/commoninfo');

function transformData(data, userInfo) {
    const commonTags = generateCommonTags(userInfo);
    const timestamp = new Date().getTime() * 1000000;

    //将收集到的数据插入flowData这张测量表
    const durationPoint = new Point('Duration')
        .timestamp(timestamp)
        .tag('pagePath', data.pagePath)
        .floatField('duration', data.duration)

        .tag('uuid', commonTags.uuid)
        .tag('ip', commonTags.ip || 'Unknown')
        .tag('browser', commonTags.browser || 'Unknown')
        .tag('os', commonTags.os || 'Unknown')
        .tag('device_type', commonTags.deviceType || 'Unknown')

        // .tag('ip', 'All')
        // .tag('browser', 'All')
        // .tag('os', 'All')
        // .tag('device_type', 'All')

    return durationPoint;
}

module.exports = { transformData };