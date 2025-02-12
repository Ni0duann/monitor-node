# Monitor-Node
**1.Influx数据库介绍：**
(1)**高性能读写:**
- **数据写入快：**InfluxDB 针对时间序列数据的写入做了优化，采用了高效的写入引擎。它能够快速处理大量的时间戳数据，每秒可以处理成千上万甚至更多的数据点写入。
- **数据读取快：**通过时间分区存储和索引机制，InfluxDB 能够快速定位和读取特定时间范围内的数据。在进行时间范围查询时，大大缩短查询响应时间。
(2)**灵活的数据模型:**
- **无需预定义模式：**与传统关系型数据库不同，InfluxDB 不需要提前定义表结构（模式）。在写入数据时，如果指定的测量（Measurement）不存在，InfluxDB 会自动创建，并根据写入的数据动态确定标签（Tags）和字段（Fields）。这使得数据的录入更加灵活，尤其适用于数据结构经常变化的场景。
- **持标签和字段：**标签用于对数据进行分类和筛选，会被索引，方便进行快速查询；字段用于存储实际的测量值，支持多种数据类型（如整数、浮点数、字符串等）。这种设计使得数据的组织和查询更加灵活高效。
(3)**丰富的查询功能:**
- **时间序列函数支持：**内置了许多专门用于时间序列分析的函数，如聚合函数（SUM、AVG、MAX、MIN 等）、差值函数、窗口函数等。这些函数可以帮助用户对不同时间间隔的数据进行统计和分析。
(4)**数据保留策略:**支持设置数据保留策略（Retention Policies），可以根据数据的重要性和使用频率，对不同时间段的数据进行不同级别的存储和管理。例如，对于近期的数据可以保留详细信息，而对于较旧的数据可以进行聚合或归档处理，以节省存储空间。

**2.Influx数据库初始化：**
通过test脚本或命令行启动Influx数据库后，需要登录http://127.0.0.1:8086 初始化设置Influx的org和bucket名称，并且查看Token，随后替换index.js中相关配置：
**InfluxDB 初始化配置：**
const influxConfig = {
  url: 'http://127.0.0.1:8086',
  token: 'your_token',
  org: 'your_org',
  bucket: 'your_bucket'
};
**本项目的node服务端中：**
1.**请求方法：**前端浏览器将收集到的数据发送到服务端node上，node操作Influx数据库进行增删查改
2.**数据格式：**数据通过Json格式发送，在数据进入Influx前，将Json数据转换为 Point 对象的格式，以便数据库能够正确地处理和存储。通过标签和字段的设置：
```
 const points = [];
 const timestamp = new Date().getTime() * 1000000; // 纳秒时间戳
 const navPoint = new Point('navigation')
    .timestamp(timestamp)
    .tag('type', 'performance')
    .intField('redirectCount', data.performance.navigation.redirectCount)
    .floatField('dnsLookupTime', data.performance.navigation.dnsLookupTime)
    .floatField('tcpConnectionTime', data.performance.navigation.tcpConnectionTime)
    .floatField('ttfb', data.performance.navigation.ttfb);
  points.push(navPoint);
  ```
**3.InfluxDB 中的数据结构：**

- **测量（Measurement）**：类似于传统数据库中的表名，它是一组具有相同名称的数据点的集合，用于标识数据的主题或类别。上述代码中` 'navigation'`就是一个测量名称。
- **标签（Tags）**：标签是键值对形式的元数据，用于对数据进行分类和筛选。标签通常是不经常变化的属性，例如设备的位置、类型等。标签会被索引，因此可以快速地根据标签进行数据查询。上述代码中`. tag('type', 'performance')`为数据点添加了一个标签，`'type' `是标签键，`'performance' `是标签值。
- **字段（Fields）**：字段也是键值对形式，但用于存储实际的测量值，这些值可以是整数、浮点数、字符串等。字段的值通常是经常变化的，例如温度、湿度等。与标签不同，字段不会被索引。
示例：`.floatField('ttfb', data.performance.navigation.ttfb)`; 为数据点添加了一个浮点数字段 `'ttfb'`，其值为` data.performance.navigation.ttfb`。
- **时间戳（Timestamp）**：时间戳记录了数据点生成的时间，精确到一定的时间单位（如纳秒），是时序数据的重要组成部分，在 InfluxDB 的数据模型里，每一个数据点都必须包含一个时间戳。用于对数据进行排序和分析。`const timestamp = new Date().getTime()`  `.timestamp(timestamp)`

4.**InfluxDB 中的数据查询**
```   
const limit = parseInt(ctx.query.limit) || 100;
const fluxQuery = `
from(bucket: "${influxConfig.bucket}")
|> range(start: -30d)
|> filter(fn: (r) => r._measurement == "navigation")
|> sort(columns: ["_time"], desc: true)
|> limit(n: ${limit})`;
```
- **from(bucket: "${influxConfig.bucket}"):**`from` 是 Flux 查询语言中的一个函数，用于指定要从哪个存储桶（bucket）中读取数据.
- **|> range(start: -30d)** `|>` 是 Flux 中的管道操作符，用于将一个函数的输出作为下一个函数的输入。这里是把从bucket桶查询到的数据**from(bucket: "${influxConfig.bucket}")**的输出结果层层传递给后面的这些函数，就相当于层层过滤器筛选得到最后符合条件的数据.
`range `函数用于指定查询的数据时间范围。`start: -30d` 表示查询的起始时间为当前时间往前推 30 天，即查询最近 30 天内的数据.
- **filter(fn: (r) => r._measurement == "navigation"):**`from` 是 Flux 查询语言中的一个函数，用于指定要从哪个存储桶（bucket）中读取数据.
- **sort(columns: ["_time"], desc: true):**`sort` 函数用于对查询结果进行排序.`columns: ["_time"]` 表示按照 _time 列（即时间戳列）进行排序.`desc: true `表示降序排序，也就是最新的数据排在前面.
- **limit(n: ${limit}):**`limit` 函数用于限制查询结果的数量.根据客户端请求的 `limit` 参数（或默认值 100）限制返回的数据数量.