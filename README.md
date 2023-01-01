[![Let's FIWARE Banner](https://github.com/lets-fiware/custom-iotagent-sakuraio/blob/gh-pages/images/lets-fiware-logo-non-free.png)](https://www.letsfiware.jp/)

# Custom IoT Agent for sakura.io

![FIWARE IoT Agents](https://nexus.lab.fiware.org/repository/raw/public/badges/chapters/iot-agents.svg)
[![License: APGL](https://img.shields.io/github/license/lets-fiware/custom-iotagent-sakuraio.svg)](https://opensource.org/licenses/AGPL-3.0)
[![NGSI v2](https://img.shields.io/badge/NGSI-v2-5dc0cf.svg)](https://fiware-ges.github.io/orion/api/v2/stable/)

The custom IoT Agent for sakura.io is a bridge between the [sakura.io](#about-sakuraio)
WebSocket API and NGSI. It supports the UltraLight based protocol over sakura.io channels
with WebSocket. It is based on the [IoT Agent Node.js Library](https://github.com/telefonicaid/iotagent-node-lib).

## Contents

<details>
<summary><strong>Details</strong></summary>

-   [Architecture](#architecture)
-   [UltraLight based protocol over sakura.io channels format](#ultralight-based-protocol-over-sakuraio-channels-format)
    -   [Make a custom payload on an IoT device](#make-a-custom-payload-on-an-iot-device)
    -   [Make attributes on IoT Agent](#make-attributes-on-iot-agent)
-   [How to build a docker container image](#how-to-build-a-docker-container-image)
-   [How to run](#how-to-run)
-   [Iot Device](#iot-device)
-   [About sakura.io](#about-sakuraio)
    -   [Reference](#reference)
-   [Third-party library](#third-party-library)
-   [Copyright and License](#copyright-and-license)

</details>

## Architecture

The custom IoT Agent for sakura.io can exchange the UltraLight based messages with devices by communicating with
the sakura.io platform. The transport mechanism between the IoT Agent and the sakura.io platform is WebSocket.
The sakura.io platform plays the role of a server and the IoT Agent plays the role of a client in the WebSocket
communication. The message format is the sakura.io channels which wrap a UltraLight payload.

![](https://github.com/lets-fiware/custom-iotagent-sakuraio/blob/gh-pages/images/iota-sakuraio-architecture-non-free.png)

In the current version, the custom IoT Agent for sakura.io supports the active attributes. The lazy attributes
and commands are not supported yet.

## UltraLight based protocol over sakura.io channels format

The custom IoT Agent for sakura.io supports the following measure payload syntax. It is composed of a list of
key-value pairs separated by the `|` character. E.g.:

```
t|32.63|h|34.44|p|1001.49
```

### Make a custom payload on an IoT device

An IoT Device makes a custom payload as shown:

```
A1234?t|32.63|h|34.44|p|1001.49A
```

An IoT Device makes a custom payload. It is concatenated an `api key` and a UltraLight payload with `?` 
and it is added a header and a trailer to confirm the integrity of data and to indicate which is an attribute type.
A 'A' indicates an active attribute.

The sakura.io channels has multiple channels. The channel can be stored 8 bytes of hex data so that a payload is
divided into 8 bytes as shown:

| Custom payload | sakura.io channels | hex              |
| -------------- | ------------------ | ---------------- |
| A1234?t\|      | channel 0          | 41313233343f747c |
| 32.63\|h\|     | channel 1          | 33322e36337c687c |
| 34.44\|p\|     | channel 2          | 33342e34347c707c |
| 1001.49A       | channel 3          | 313030312e343941 |

The following is an encode routine run in an IoT device.

```
key = os.environ.get('IOTA_KEY', '1234');
temperature = bme280.get_temperature()
pressure = bme280.get_pressure()
humidity = bme280.get_humidity()

measures = 'A{}?t|{:05.2f}|h|{:05.2f}|p|{:05.2f}A'.format(key, temperature, humidity, pressure)

for i in range(math.ceil(len(measures) / 8)):
    sakuraio.enqueue_tx(i, measures[i * 8:i * 8 + 8])
sakuraio.send()
```

### Make attributes on IoT Agent

The IoT Agent receives the following JSON data from the sakura.io platform as shown:

```
{
  "module": "xCr8vqsJ0Zbe",
  "type": "channels",
  "datetime": "2020-07-28T08:09:49.266964572Z",
  "payload": {
    "channels": [
      {
        "channel": 0,
        "type": "b",
        "value": "41313233343f747c",
        "datetime": "2020-07-28T08:09:49.167965338Z"
      },
      {
        "channel": 1,
        "type": "b",
        "value": "33322e36337c687c",
        "datetime": "2020-07-28T08:09:49.192965338Z"
      },
      {
        "channel": 2,
        "type": "b",
        "value": "33342e34347c707c",
        "datetime": "2020-07-28T08:09:49.217965338Z"
      },
      {
        "channel": 3,
        "type": "b",
        "value": "313030312e343941",
        "datetime": "2020-07-28T08:09:49.242965338Z"
      }
    ]
  }
}
```

The `module` attribute value in the JSON data is a device ID. To decode a custom payload, the IoT Agent
concatenates hex data divided into each channel in the JSON data and converts the hex data to a string.
The following is an decode routine.

```
let hex = '';
for (let i = 0; i < payload.channels.length; i++) {
    if (payload.channels[i].channel == 0) {
        hex = '';
    }
    hex +=  payload.channels[i].value;
}
const bin = Uint8Array.from(Buffer.from(hex, "hex"));
const index = bin.indexOf(0);
let ul = new TextDecoder().decode((index == -1) ? bin : bin.subarray(0, index));

iotAgentLib.logModule.debug(context,`${ul}`);

if (ul.slice(0 ,1) != ul.slice(-1)) {
    iotAgentLib.logModule.error(context,`Data integrity error: ${ul}`);
    return;
}
ul = ul.slice(1).slice(0, -1);

const query = {
    i : data.module,                    // device ID
    k : ul.slice(0, ul.indexOf('?')),   // API key
    d : ul.slice(ul.indexOf('?') + 1),  // Ultralight payload
    t: payload.channels[0].datetime
};
```

As a result, the following data can be retrieved from the JSON data.

```
{
  "i": "xCr8vqsJ0Zbe",
  "k": "1234",
  "d": "t|32.63|h|34.44|p|1001.49",
  "t": "2020-07-28T08:09:49.167965338Z"
}
```

Finally, the IoT Agent calls the parseUl function to parse UltaLight payload and make attributes.

```
[
  {
    "name": "temperature",
    "type": "Number",
    "value": 32.63,
    "metadata": {
      "TimeInstant": {
        "type": "DateTime",
        "value": "2020-07-28T08:09:49.167Z"
      }
    }
  },
  {
    "name": "relativeHumidity",
    "type": "Number",
    "value": 34.44,
    "metadata": {
      "TimeInstant": {
        "type": "DateTime",
        "value": "2020-07-28T08:09:49.167Z"
      }
    }
  },
  {
    "name": "atmosphericPressure",
    "type": "Number",
    "value": 1001.49,
    "metadata": {
      "TimeInstant": {
        "type": "DateTime",
        "value": "2020-07-28T08:09:49.167Z"
      }
    }
  }
]
```

## How to build a docker container image

Run the following commands to build a docker container image for IoT Agent for sakura.io.

```
cd docker
make build
```

The IoT Agent container is driven by environment variables as shown:

| Key                   | Value                   | Description                                                                                                                                           |
| --------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| IOTA_WEBSOCKET        | `ws://localhost:8080/`  | The sakura.io WebSocket URL                                                                                                                           |
| IOTA_CB_HOST          | `orion`                 | Hostname of the context broker to update context                                                                                                      |
| IOTA_CB_PORT          | `1026`                  | Port that context broker listens on to update context                                                                                                 |
| IOTA_NORTH_PORT       | `4041`                  | Port used for Configuring the IoT Agent and receiving context updates from the context broker                                                         |
| IOTA_REGISTRY_TYPE    | `mongodb`              | Whether to hold IoT device info in memory or in a database                                                                                            |
| IOTA_MONGO_HOST       | `mongo`                 | The hostname of mongoDB - used for holding device information                                                                                         |
| IOTA_MONGO_PORT       | `27017`                 | The port mongoDB is listening on                                                                                                                      |
| IOTA_MONGO_DB         | `iotasakuraio`          | The mongDB database name                                                                                                                              |
| IOTA_PROVIDER_URL     | `http://iot-agent:4041` | URL passed to the Context Broker when commands are registered, used as a forwarding URL location when the Context Broker issues a command to a device |
| IOTA_LOG_LEVEL        | `DEBUG`                 | The log level of the IoT Agent                                                                                                                        |

## How to run

There is the `IOTA_WEBSOCKET` environment variable in docker/docker-compose.yml. Replace the value with a
WebSocket URL that you get from sakura.io control panel and run `docker-compose up -d` in docker directory.

```
version: "3"

services:

    orion:
        image: fiware/orion:2.4.0
        ports:
            - 1026:1026
        depends_on:
            - mongo
        command:
            -dbhost mongo
            -db orion

    mongo:
        image: mongo:3.6.16
        command: --nojournal --smallfiles
        volumes:
            - ./data/mongo-data:/data/db

    iot-agent:
        image: fisuda/custom-iot-agent-sakuraio:latest
        ports:
            - 4041:4041
        depends_on:
            - mongo
        environment:
            - IOTA_LOG_LEVEL=DEBUG
            # - IOTA_WEBSOCKET=wss://api.sakura.io/ws/v1/00000000-0000-0000-0000-000000000000
            # - IOTA_CB_HOST=orion
            # - IOTA_CB_PORT=1026
            # - IOTA_NORTH_PORT=4041
            # - IOTA_REGISTRY_TYPE=mongodb
            # - IOTA_MONGO_HOST=mongo
            # - IOTA_MONGO_PORT=27017
            # - IOTA_MONGO_DB=iotasakuraio
            # - IOTA_SERVICE=openiot
            # - IOTA_SUBSERVICE=/sakuraio
            # - IOTA_PROVIDER_URL=http://iot-agent:4041
            # - IOTA_DEVICE_REGISTRY_DURATION=P1M
            # - IOTA_DEFAULT_TYPE=Thing
```

## IoT Device

The source code of the IoT device that supports this IoT Agent is [here](https://github.com/lets-fiware/fiware-sakuraio)
(FIWARE-sakuraio - Github).


## About sakura.io

[SAKURA internet Inc.](https://www.sakura.ad.jp/en/corporate/) is a provider of internet infrastructures in Japan.
They provides [sakura.io service](https://sakura.io/). It's composed of the sakura.io platform and communication module.
The communication module supports 4G-LTE data communication and it can be attached on Raspberry Pi, Arduino and so on.

![](https://github.com/lets-fiware/custom-iotagent-sakuraio/blob/gh-pages/images/sakuraio-module-on-raspberrypi-non-free.png)

### Reference
-    [sakura.io - GitHub](https://github.com/sakuraio)
-    [sakura.io documents](https://sakura.io/docs/)

## Third-party library

The following third-party library is used under license:

1.  [iotagent-node-lib](https://github.com/telefonicaid/iotagent-node-lib) - **AGPL-3.0 License**
    © 2014-2020 Telefonica Investigación y Desarrollo, S.A.U
2.  [ws: a Node.js WebSocket library](https://github.com/websockets/ws) - **MIT License**

---

## Copyright and License

Copyright (c) 2020-2023 Kazuhito Suda<br>
Custom IoT Agent for sakura.io is licensed under [Affero General Public License (GPL) version 3](./LICENSE).
