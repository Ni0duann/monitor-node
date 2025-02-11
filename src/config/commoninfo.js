// 每次请求都会携带的公共参数，用户的IP UUID 浏览器 操作系统 设备类型.
function generateCommonTags(userInfo) {
    return {
        ip: userInfo.ip || 'Unknown',
        uuid: userInfo.uuid || 'Unknown',
        browser: userInfo.browser || 'Unknown',
        os: userInfo.os || 'Unknown',
        deviceType: userInfo.userAgent.device.type || 'desktop'
    };
}

module.exports = { generateCommonTags };
