// utils/pvuvTransform.js
const { Point } = require('@influxdata/influxdb-client');
const { generateCommonTags } = require('../config/commoninfo');

function transformData(data, userInfo) {
    const commonTags = generateCommonTags(userInfo);
    const timestamp = new Date(data.timestamp).getTime() * 1000000;

    //将收集到的数据插入flowData这张测量表
    const pvuvPoint = new Point('flowData')
        .timestamp(timestamp)
        .tag('pagePath', data.pagePath)
        .tag('datatype', data.datatype)
        .tag('uuid', commonTags.uuid)
        // .tag('ip', commonTags.ip || '::1')
        // .tag('browser', commonTags.browser || 'Unknown')
        // .tag('os', commonTags.os || 'Unknown')
        // .tag('device_type', commonTags.deviceType || 'desktop')
        .tag('ip', 'All')
        .tag('browser', 'All')
        .tag('os', 'All')
        .tag('device_type', 'All')
        .intField('addCount', parseInt(data.addCount));

    return pvuvPoint;
}

module.exports = { transformData };