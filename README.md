# Monitor-Node
通过test文件夹的test脚本启动Influx数据库后，需要登录http://127.0.0.1:8086
初始化设置Influx的  org和bucket名称，并且查看Token，随后替换index.js中相关配置
// InfluxDB 配置
const influxConfig = {
  url: 'http://127.0.0.1:8086',
  token: 'zcxZEZxqKFcStrfTXY2aOS9Lb_43Z8JYp2Cg1PUFPQk1Y8ElVgCtu2mz0O2hsqfPHfI49tyrNQp65ID1yGwY_g==',
  org: 'Dance',
  bucket: 'monitor data'
};