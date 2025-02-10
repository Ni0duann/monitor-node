// 每次请求都会携带的公共参数，用户的IP UUID 浏览器 操作系统 设备类型.
function generateCommonTags(userInfo) {
    return {
        ip: userInfo.ip,
        uuid: userInfo.uuid,
        browser: userInfo.userAgent.browser.name,
        os: userInfo.userAgent.os.name,
        deviceType: userInfo.userAgent.device.type || 'desktop'
    };
}

module.exports = { generateCommonTags };
