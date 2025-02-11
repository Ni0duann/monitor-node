# API文档

## 一、概述
本项目是一个基于 **Koa** 框架构建的服务端应用，主要用于收集和管理网页性能数据、页面浏览事件、PV/UV 数据以及页面停留时长数据。同时，提供了对性能数据的查询和删除功能，以便更好地进行数据管理和分析。

## 二、基础信息
- **服务器地址（Base_url）**：`http://localhost:5500`
- **数据格式**：JSON
- **数据库**：**InfluxDB**（用于存储时间序列数据）
- **支持的客户端**：Web浏览器、移动设备等

## 三、接口详情

### 1. 性能监控数据上报接口
- **接口地址**：`POST /api/report`
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

#### 请求示例
```json
{
  "success": true
}
```

 ### 2. 获取性能数据接口
 - **接口地址**：`GET /api/performance`
- **功能描述**：从 **InfluxDB** 数据库中查询最近的网页性能数据。。

#### 请求参数

| 参数名 | 类型 | 是否必填 | 描述 |
| ---- | ---- | ---- | ---- |
| `limit` | number | 否 | 查询结果的最大数量，默认值为 100 |

#### 请求示例
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2025-02-10T12:00:00Z",
      "type": "performance",
      "field": "ttfb",
      "value": 100,
      "device": "desktop",
      "browser": "Chrome"
    }
  ]
}
```

 ### 3. 页面浏览事件上报接口
 - **接口地址**：`POST /api/page-view`
- **功能描述**：接收客户端上报的页面浏览事件，并将其写入 **InfluxDB** 数据库。
#### 请求参数
| 参数名 | 类型 | 是否必填 | 描述 |
| ---- | ---- | ---- | ---- |
| `page_path` | string | 是 | 页面路径 |
| `browser` | string | 是 | 浏览器名称 |
| `os` | string | 是 | 操作系统名称 |
| `device_type` | string | 是 | 设备类型 |
| `timestamp` | string | 是 | 浏览时间戳 |

#### 请求示例
```json
{
  "page_path": "/home",
  "browser": "Chrome",
  "os": "Windows 10",
  "device_type": "desktop",
  "timestamp": "2025-02-10T12:00:00Z"
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

  ### 4. 更新上传 PV/UV 数据接口
  - **请求方法**：`POST`
 - **接口地址**：`/api/push_flowData`
- **功能描述**：根据`pagePath` 更新 PV 和 UV 数据。
 ### 请求参数
| 参数名 | 类型 | 是否必填 | 描述 |
| ---- | ---- | ---- | ---- |
| `pagePath` | string | 是 | 页面名称，取值为 1、2 或 3（代表是子页面Page1或2，3的pv uv数据） |

#### 请求示例
```json
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

 ### 5. 获取 PV/UV 数据接口
 - **接口地址**：`GET /api/get-pv-uv`
- **功能描述**：获取当前的 PV 和 UV 数据。
 ### 请求参数 无
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