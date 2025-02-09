const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const config = require('../config/influx');

class InfluxService {
    constructor() {
        this.influxDB = new InfluxDB({
            url: config.url,
            token: config.token
        });

        this.writeApi = this.influxDB.getWriteApi(config.org, config.bucket);
        this.queryApi = this.influxDB.getQueryApi(config.org);
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
}

module.exports = new InfluxService();