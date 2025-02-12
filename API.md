# API文档

## 一、概述
本项目是一个基于 **Koa** 框架构建的服务端应用，主要用于收集和管理网页性能数据、页面浏览事件、PV/UV 数据以及页面停留时长数据。同时，提供了对性能数据的查询和删除功能，以便更好地进行数据管理和分析。

## 二、基础信息
- **服务器地址（Base_url）**：`http://localhost:5500`
- **数据格式**：**JSON**
- **数据库**：**InfluxDB**（用于存储时间序列数据）
- **支持的客户端**：Web浏览器、移动设备等

## 三、接口详情

### 1. 性能监控数据上报接口
- **请求方法**：`POST `
- **接口地址**：`/api/push_pref`
- **功能描述**：接收客户端上报的网页性能数据，并将其写入 **InfluxDB** 数据库。

#### 请求参数
| **序号** | **参数名** | **类型** | **是否必填** | **描述** |
|:--------|:-----------|:---------|:-------------|:---------|
| 1       | `performance.ttfb` | number | 是 | 首字节响应时间（Time To First Byte） |
| 2       | `performance.lcpRenderTime` | number | 是 | 最大内容绘制时间（Largest Contentful Paint） |
| 3       | `performance.fcpStartTime` | number | 是 | 首次内容绘制时间（First Contentful Paint） |
| 4       | `performance.whiteScreenCount` | number | 否 | 白屏计数 |
| 5       | `errors` | object | 否 | 错误信息 |

#### 请求示例
```json
{
  "performance": {
    "ttfb": 100,
    "lcpRenderTime": 200,
    "fcpStartTime": 150,
    "whiteScreenCount": 1
  },
  "errors": {}
}
```
#### 响应参数
| 参数名 | 类型 | 描述 |
|:--------|:-----------|:---------|
| `success` | boolean | 请求是否成功 |

#### 响应示例
```json
{
    "success": true
}
```

 ### 2. 获取性能数据接口
 - **请求方法**：`GET `
 - **接口地址**：`/api/get_pref`
- **功能描述**：从 **InfluxDB** 数据库中查询最近的网页性能数据。

#### 请求参数
| 参数名 | 类型 | 是否必填 | 描述 |
| ---- | ---- | ---- | ---- |
| `limit` | number | 否 | 查询结果的最大数量，默认值为 100，即最多显示100条数据 |
| `rangeTime` | number | 否 | 查询的时间范围，默认值为 7，即过去七天的数据 |
| `startTime` | 日期字符串格式例如：`2025/02/12 12:30:00`或 `2025-02-12T12:30:00.000Z` | 否 | 查询时间范围的开始时间 |
| `endTime` | 日期字符串格式例如：`2025/02/12 13:30:00`或 `2025-02-12T13:30:00.000Z` | 否 | 查询时间范围的结束时间 |
#### 注意:！ 不可同时输入 `rangeTime`和 (`startTime,endTime`)要么只输入 `rangeTime`，要么只输入`startTime`和`endTime`，`startTime`和`endTime`两者的日期格式必须相同！开始日期必须小于结束日期!

#### 请求示例
`http://localhost:5500/api/get_pref?rangeTime=10`
或
`http://localhost:5500/api/get_pref?startTime=2025/02/12 12:30:00&endTime=2025/02/12 13:30:00`
或
`http://localhost:5500/api/get_pref?startTime=2025-02-12T12:30:00.000Z&endTime=2025-02-12T13:30:00.000Z`

#### 响应参数
| 参数名 | 类型 | 描述 |
|:--------|:-----------|:---------|
| `success` | boolean | 请求是否成功 |
| `data` | Array | 根据要求返回的数据 |

#### 响应示例
```json
{
    "success": true,
    "data": [
        {
            "result": "_result",
            "table": 0,
            "_start": "2025-02-02T05:41:37.4702265Z",
            "_stop": "2025-02-12T05:41:37.4702265Z",
            "_time": "2025-02-10T16:33:50.405Z",
            "_value": 123.3000000000466,
            "_field": "fcp_start_time",
            "_measurement": "performanceData",
            "browser": "Chrome",
            "device_type": "desktop",
            "ip": "::ffff:127.0.0.1",
            "os": "Windows",
            "type": "performance",
            "uuid": "1b11c7ba-a04c-4377-ab6b-fb4c7ab119ba"
        },
        {
            "result": "_result",
            "table": 1,
            "_start": "2025-02-02T05:41:37.4702265Z",
            "_stop": "2025-02-12T05:41:37.4702265Z",
            "_time": "2025-02-10T16:33:50.405Z",
            "_value": 234.3000000000466,
            "_field": "lcp_render_time",
            "_measurement": "performanceData",
            "browser": "Chrome",
            "device_type": "desktop",
            "ip": "::ffff:127.0.0.1",
            "os": "Windows",
            "type": "performance",
            "uuid": "1b11c7ba-a04c-4377-ab6b-fb4c7ab119ba"
        },
        {
            "result": "_result",
            "table": 2,
            "_start": "2025-02-02T05:41:37.4702265Z",
            "_stop": "2025-02-12T05:41:37.4702265Z",
            "_time": "2025-02-10T16:33:50.405Z",
            "_value": 345.3000000000466,
            "_field": "ttfb",
            "_measurement": "performanceData",
            "browser": "Chrome",
            "device_type": "desktop",
            "ip": "::ffff:127.0.0.1",
            "os": "Windows",
            "type": "performance",
            "uuid": "1b11c7ba-a04c-4377-ab6b-fb4c7ab119ba"
        },
        ]
}
```
#### 注意：前端人员暂时只需关注`response.data._field`和`response.data._value`

### 2. 白屏URL上报接口
 - **请求方法**：`POST`
 - **接口地址**：`/api/push/WhiteScreen`
- **功能描述**：接收客户端上报的页面浏览事件，并将其写入 **InfluxDB** 数据库。
#### 请求参数
| 参数名 | 类型 | 是否必填 | 描述 |
| ---- | ---- | ---- | ---- |
| `page_path` | string | 是 | 页面路径例如`page1` `page2` `page3`表示出现白屏的页面地址 |
| `browser` | string | 否 | 浏览器名称 |
| `os` | string | 否 | 操作系统名称 |
| `device_type` | string | 否 | 设备类型 |

#### 请求示例
```json
{
      "pageUrl": "page1"
}
```

#### 响应参数
| 参数名 | 类型 | 描述 |
| ---- | ---- | ---- |
| `success` | boolean | 请求是否成功 |

#### 响应示例
```json
{
    "success": true,
    "data": [
        {
            "result": "_result",
            "table": 0,
            "_start": "2025-02-10T15:57:15.7834214Z",
            "_stop": "2025-02-11T15:57:15.7834214Z",
            "_value": 4,
            "pageUrl": "/page1"
        }
    ]
}
```

 ### 3. 白屏次数URL查询接口
 - **接口地址**：`POST /api/page-view`
- **功能描述**：接收客户端上报的页面浏览事件，并将其写入 **InfluxDB** 数据库。
#### 请求参数
| 参数名 | 类型 | 是否必填 | 描述 |
| ---- | ---- | ---- | ---- |
| `page_path` | string | 是 | 页面路径除了`page1` `page2` `page3`还有`total`代表所有页面总的白屏次数 |
| `rangeTime` | number | 否 | 查询的时间范围，默认值为 7，即过去七天的数据 |
| `browser` | string | 否 | 浏览器名称 |
| `os` | string | 否 | 操作系统名称 |
| `device_type` | string | 否 | 设备类型 |
| `timestamp` | string | 否 | 浏览时间戳 |

#### 请求示例
`http://localhost:5500/api/get/WhiteScreen?pageUrl=page2`
或
`http://localhost:5500/api/get/WhiteScreen?pageUrl=page1&rangeTime=3`
或
`http://localhost:5500/api/get/WhiteScreen?rangeTime=3&pageUrl=total`

#### 响应参数
| 参数名 | 类型 | 描述 |
| ---- | ---- | ---- |
| `success` | boolean | 请求是否成功 |
| `data` | Array | 根据要求返回的数据 |

#### 响应示例
**若为子页面查询：**
```json
{
    "success": true,
    "data": [
        {
            "result": "_result",
            "table": 0,
            "_start": "2025-02-09T06:17:40.0827487Z",
            "_stop": "2025-02-12T06:17:40.0827487Z",
            "_value": 7,
            "pageUrl": "page1"
        }
    ]
}
```

**若为total查询：**
```json
{
    "success": true,
    "totalCount": 14
}
```

  ### 4. 更新上传流量数据 PV/UV 数据接口
  - **请求方法**：`POST`
 - **接口地址**：`/api/push_flowData`
- **功能描述**：根据`pagePath` 更新 PV 和 UV 数据。
 ### 请求参数
| 参数名 | 类型 | 是否必填 | 描述 |
| ---- | ---- | ---- | ---- |
| `pagePath` | string | 是 | 页面名称，取值为 `page1` `page2` `page3`（代表是子页面Page1或2，3的数据） |
| `dataType` | string | PV 和 UV 数据对象,如`pv` `uv` |

#### 请求示例
```json
{
      "pagePath": "page2",
      "datatype": "pv"
}

{
      "pagePath": "page3",
      "datatype": "uv"
}
```

#### 响应参数
| 参数名 | 类型 | 描述 |
| ---- | ---- | ---- |
| `success` | boolean | 请求是否成功 |
#### 响应示例
```json
{
  "success": true
}
```

 ### 5. 获取流量数据 PV/UV 数据接口
  - **请求方法**：`GET`
 - **接口地址**：`/api/get_flowData`
- **功能描述**：获取当前的 PV 和 UV 数据。
 ### 请求参数 
 | 参数名 | 类型 | 描述 |
| ---- | ---- | ---- |
| `pagePath`| string | 请求数据的页面如`page1` `page2` `page3` `total`|
| `dataType` | string | PV 和 UV 数据对象,如`pv` `uv` |
| `rangeTime` | Int(整数) | 往前查询的时间范围,如`1`表示过去1天（过去24h）的数据，`7`表示过去7天的数据 |

#### 请求示例
``http://localhost:5501/api/get-pv-uv``
#### 响应参数
| 参数名 | 类型 | 描述 |
| ---- | ---- | ---- |
| `success `| boolean | 请求是否成功 |
| `data` | object | PV 和 UV 数据对象 |
#### 响应示例
```json
{
    "success": true,
    "data": {
        "totalCount": 6
    }
}
```

 ### 6. 页面停留时长数据上报接口
 - **接口地址**：`POST /api/report-duration`
- **功能描述**：接收客户端上报的页面停留时长数据，并将其写入 **InfluxDB** 数据库。
#### 请求参数
| 参数名 | 类型 | 是否必填 | 描述 |
| ---- | ---- | ---- | ---- |
| `pagePath` | string | 是 | 页面路径 |
| `duration` | number | 是 | 停留时长（毫秒） |

#### 请求示例
```json
{
  "pagePath": "/home",
  "duration": 3000
}
```
#### 响应参数
| 参数名 | 类型 | 描述 |
| ---- | ---- | ---- |
| `success` | boolean | 请求是否成功 |
#### 响应示例
```json
{
  "success": true
}
```

 ### 7.  获取页面停留时长数据接口
 - **接口地址**：`GET /api/get-page-durations`
- **功能描述**：从 **InfluxDB** 数据库中查询最近 30（可以选择任意时间范围）天的页面**平均**停留时长数据。
#### 请求参数：
| 参数名 | 类型 | 描述 |
| ---- | ---- | ---- |
| `pagePath` | string | 代表子页面如`page1` `page2` `page3` |
| `rangeTime` | array | 查询结果数组，包含页面路径和平均停留时长 |
 
#### 请求示例
``http://localhost:5501/api/get-page-durations``
#### 响应参数
| 参数名 | 类型 | 描述 |
| ---- | ---- | ---- |
| `success` | boolean | 请求是否成功 |
| `data` | array | 查询结果数组，包含页面路径,筛选的开始时间戳和结束时间戳，和改时间范围内的平均停留时长 |
#### 响应示例
```json
{
    "success": true,
    "data": [
        {
            "result": "_result",
            "table": 0,
            "_start": "2025-02-10T09:50:30.9276979Z",
            "_stop": "2025-02-11T09:50:30.9276979Z",
            "pagePath": "page1",
            "_value": 1726.28
        }
    ]
}

```

 ### 8.  删除性能监控数据接口
 - **接口地址**：`DELETE /api/performance/:timestamp`
- **功能描述**：根据时间戳删除 **InfluxDB** 数据库中的性能数据。
#### 请求参数：
| 参数名 | 类型 | 是否必填 | 描述 |
| ---- | ---- | ---- | ---- |
| `timestamp` | string | 是 | 时间戳 |
 
#### 请求示例
``http://localhost:5501/api/performance/2025-02-10T12:00:00Z``
#### 响应参数
| 参数名 | 类型 | 描述 |
| ---- | ---- | ---- |
| `success` | boolean | 请求是否成功 |
#### 响应示例
```json
{
  "success": true
}
```

 ### 四、错误处理
当请求出现错误时，响应的 HTTP 状态码和响应体如下：
| HTTP 状态码 | 错误信息 | 描述 | 
| ---- | ---- | ---- | 
| `400` | 缺少关键性能指标（TTFB/LCP/FCP）！| 性能数据上报接口中缺少必要的性能指标 |
| `400` | 无效的事件 ID | 更新 PV/UV 数据接口中传入的事件 ID 无效 | 
| `500` | 服务器内部错误 | 服务器处理请求时发生内部错误 | 
| `500` | 查询失败 | 获取性能数据接口或获取页面停留时长数据接口查询数据失败 | 
| `500` | 上报失败 | 性能数据上报接口、页面浏览事件上报接口或页面停留时长数据上报接口上报数据失败 | 
| `500` | 更新数据失败 | 更新 PV/UV 数据接口更新数据失败 | 
| `500` | 获取数据失败 | 获取 PV/UV 数据接口获取数据失败 | 
| `500` | 保存停留时长数据失败 | 页面停留时长数据上报接口保存数据失败 | 
| `500` | 查询停留时长数据失败 | 获取页面停留时长数据接口查询数据失败 | 
| `500` | 删除数据失败 | 删除性能数据接口删除数据失败 | 