const COMMANDS = require("./commands");
const eph = require("./endpoint-handler.js");

module.exports = (logger, [
    C_DEVICES,
    C_ENDPOINTS,
    C_VAULT
]) => {


    C_DEVICES.found({
        meta: {
            manufacturer: "samsung",
            model: "UE60J6289"
        }
    }, (device) => {

        eph(logger, [
            C_DEVICES,
            C_ENDPOINTS,
            C_VAULT
        ]);

    }, async (query) => {
        try {

            let device = await C_DEVICES.add({
                ...query,
                name: "Samung Smart TV",
                interfaces: [{
                    settings: {
                        host: "192.168.2.100",
                        port: 8000,
                        socket: "tcp",
                        mac: "5c:49:7d:21:14:27"
                    },
                    type: "ETHERNET",
                    description: "SmartView API",
                    adapter: [
                        "raw"
                    ]
                }, {
                    settings: {
                        host: "192.168.2.100",
                        port: 8001,
                        socket: "tcp",
                        mac: "5c:49:7d:21:14:27"
                    },
                    type: "ETHERNET",
                    adapter: [
                        "raw"
                    ]
                }]
            });

            let commands = COMMANDS.map((cmd) => {
                cmd.interface = device.interfaces[0]._id;
                cmd.alias = cmd.payload;
                cmd.name = cmd.payload;
                return cmd;
            });

            let endpoint = await C_ENDPOINTS.add({
                name: device.name,
                device: device._id,
                commands
            });

            let vault = await C_VAULT.add({
                identifier: endpoint._id,
                name: `${endpoint.name} (device=${device._id})`,
                secrets: [{
                    key: "session_id",
                    name: "SmartView Session ID"
                }, {
                    key: "session_key",
                    name: "SmartView Session Key"
                }],
            });

            logger.info("Device stack added", device, endpoint, vault);

        } catch (err) {

            logger.error("Could not add device stack", err);

        }
    });


};