const commonTags = {
    ip: userInfo.ip,
    uuid: userInfo.uuid,
    browser: userInfo.userAgent.browser.name,
    os: userInfo.userAgent.os.name,
    deviceType: userInfo.userAgent.device.type || 'desktop'
};
module.exports=commonTags
