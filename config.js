/*
 * Copyright (c) 2020 Kazuhito Suda
 *
 * This file is part of custom-iotagent-sakuraio
 *
 * https://github.com/lets-fiware/custom-iotagent-sakuraio
 *
 * custom-iotagent-sakuraio is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * custom-iotagent-sakuraio is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with custom-iotagent-sakuraio.
 * If not, see http://www.gnu.org/licenses/.
 *
 */

const config = {
    logLevel: (process.env.IOTA_LOG_LEVEL  || 'DEBUG'),
    contextBroker: {
        host: (process.env.IOTA_CB_HOST || 'orion'),
        port: (process.env.IOTA_CB_PORT || '1026'),
        ngsiVersion: 'v2'
    },
    server: {
        port: (process.env.IOTA_NORTH_PORT || '4041')
    },
    deviceRegistry: {
        type: (process.env.IOTA_REGISTRY_TYPE || 'mongodb')
    },
    mongodb: {
        host: (process.env.IOTA_MONGO_HOST || 'mongo'),
        port: (process.env.IOTA_MONGO_PORT || '27017'),
        db: (process.env.IOTA_MONGO_DB ||'iotasakuraio')
    },
    types: {
    },
    service: (process.env.IOTA_SERVICE || 'openiot'),
    subservice: (process.env.IOTA_SUBSERVICE || '/sakuraio'),
    providerUrl: (process.env.IOTA_PROVIDER_URL || 'http://iot-agent:4041'),
    deviceRegistrationDuration: (process.env.IOTA_DEVICE_REGISTRY_DURATION ||'P1M'),
    defaultType: (process.env.IOTA_DEFAULT_TYPE || 'Thing'),
    websocket: (process.env.IOTA_WEBSOCKET || 'ws://localhost:8080/')
};

module.exports = config;
