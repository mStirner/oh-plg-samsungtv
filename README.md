# Introduction
Plugin to controll Samsung TV via SmartView API.
This plugin is based on the fantastic work of https://github.com/McKael/samtv

NOTE: 
The SmartView API is a bit strange. Not all models/tv work the same way.<br />
E.g. my TV in the Bedroom works without a special handshake, just over a simple WebSocket connection.<br />
The TV in the Livingroom needs a special crypto handshake.<br />

This plugin does handle only the special crypto case and can not be used with the plain websocket API.

The plugin is very quick & dirty, and more a proof-of-concept!<br />
It depends on the externel pairing functionality of:
- https://github.com/McKael/smartcrypto
- https://github.com/sectroyer/SmartCrypto

Pairing is coming soon!<br />
A "working-on" port to node.js can be found here: https://github.com/mStirner/samtv-remote

Special thanks to [@sectroyer](https://github.com/sectroyer) & [@McKael](https://github.com/McKael) for their incredible and awesome work!

## Development
Create a new plugin over the HTTP API:<br />
`[PUT] http://{{HOST}}:{{PORT}}/api/plugins/`:
```json
{
    "name": "Samsung TV",
    "enabled": true,
    "version": 1,
    "intents": [
        "devices", 
        "endpoints", 
        "vault"
    ],
    "uuid": "ac19271c-82b2-11ed-9028-c3c23c2befc8"
}
```

Example output from the API:
```json
{
    "_id": "63a58de22e87a47ef614ae56",
    "name": "Samsung TV",
    "enabled": true,
    "version": 1,
    "intents": [
        "devices",
        "endpoints",
        "vault"
    ],
    "uuid": "ac19271c-82b2-11ed-9028-c3c23c2befc8",
    "timestamps": {
        "created": 1671794146435,
        "updated": null
    },
    "autostart": true
}
```

## Device description
`[GET] http://192.168.2.100:8001/api/v2/`
```json
{
  "id": "uuid:bd816fe9-5a03-48f2-8cbd-c048378e5645",
  "name": "[TV] UE60J6289",
  "version": "2.0.25",
  "device": {
    "type": "Samsung SmartTV",
    "duid": "uuid:bd816fe9-5a03-48f2-8cbd-c048378e5645",
    "model": "15_HAWKM_2D",
    "modelName": "UE60J6240",
    "description": "Samsung DTV RCR",
    "networkType": "wired",
    "ssid": "",
    "ip": "192.168.2.100",
    "firmwareVersion": "Unknown",
    "name": "[TV] UE60J6289",
    "id": "uuid:bd816fe9-5a03-48f2-8cbd-c048378e5645",
    "udn": "uuid:bd816fe9-5a03-48f2-8cbd-c048378e5645",
    "resolution": "1920x1080",
    "countryCode": "DE",
    "msfVersion": "2.0.25",
    "smartHubAgreement": "true",
    "wifiMac": "5c:49:7d:21:14:27",
    "developerMode": "0",
    "developerIP": ""
  },
  "type": "Samsung SmartTV",
  "uri": "http://192.168.2.100:8001/api/v2/"
}
```

Mount the plugin source code into the backend plugins folder:
```sh
sudo mount --bind ~/projects/OpenHaus/plugins/oh-plg-samsungtv/ ~/projects/OpenHaus/backend/plugins/ac19271c-82b2-11ed-9028-c3c23c2befc8/
```
> Use the UUID returned from the HTTP API after creating the plugin item

Then start the backend with:
```sh
npm run dev
```

The changes made in the plugin source code, should trigger a automatically backend reload.

## Links & Informations
- https://github.com/McKael/smartcrypto
- https://github.com/sectroyer/SmartCrypto
- https://github.com/McKael/samtv
- https://stackoverflow.com/q/74888856/5781499
- https://stackoverflow.com/a/74890161/5781499