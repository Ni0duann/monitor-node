const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const { DeleteAPI } = require('@influxdata/influxdb-client-apis');
const config = require('../config/influx');

class InfluxService {
    constructor() {
        this.influxDB = new InfluxDB({
            url: config.url,
            token: config.token
        });
        this.writeApi = this.influxDB.getWriteApi(config.org, config.bucket);
        this.queryApi = this.influxDB.getQueryApi(config.org);
        this.deleteApi = new DeleteAPI(this.influxDB);
    }

    async writePoints(points) {
        this.writeApi.writePoints(points);
        await this.writeApi.flush();
    }

    async queryData(fluxQuery) {
        return new Promise((resolve, reject) => {
            const result = [];
            this.queryApi.queryRows(fluxQuery, {
                next: (row, tableMeta) => {
                    result.push(tableMeta.toObject(row));
                },
                error: reject,
                complete: () => resolve(result)
            });
        });
    }

    async deleteData(timestamp) {
        const start = new Date(timestamp).toISOString();
        const stop = new Date(new Date(timestamp).getTime() + 1).toISOString();
        await this.deleteApi.postDelete({
            org: config.org,
            bucket: config.bucket,
            body: {
                start,
                stop,
                predicate: '_measurement="navigation"'
            }
        });
    }
}

module.exports = new InfluxService();