const crypto = require("crypto");

const handshake = require("./handshake.js");

const UUID = "samtv";
var SESSION_ID = null;
var SESSION_KEY = null;

var aesEncrypt = ((val, algo = "aes-128-ecb") => {
    let cipher = crypto.createCipheriv(algo, SESSION_KEY, null);
    return Buffer.concat([cipher.update(val, 'utf8'), cipher.final()]);
});

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

        C_ENDPOINTS.found({
            device: device._id
        }, async (endpoint) => {

            let vault = await C_VAULT.items.find((vault) => {
                return vault.identifier === endpoint._id;
            });

            console.log(vault)

            let key = vault.secrets.find(({ key }) => {
                return key === "session_key";
            });

            let id = vault.secrets.find(({ key }) => {
                return key === "session_id";
            });

            SESSION_KEY = Buffer.from(key.decrypt(), "hex");
            SESSION_ID = id.decrypt();


            console.log("SEESION_KEY=", SESSION_KEY);
            console.log("SESSION_ID=", SESSION_ID);

            let iface = device.interfaces.find(({ settings: { port } }) => {
                return port === 8000;
            });

            handshake(iface, (ws) => {

                console.log("Handshake complete");
                console.log("Setup command hanlder")

                endpoint.commands.forEach((command) => {
                    command.setHandler((cmd, iface, params, done) => {

                        let request = {
                            "method": "POST",
                            "body": {
                                "plugin": "RemoteControl",
                                "param1": `uuid:${UUID}`,
                                "param2": "Click",
                                "param3": cmd.payload,
                                "param4": false,
                                "api": "SendRemoteKey",
                                "version": "1.000"
                            }
                        };

                        let aes = aesEncrypt(JSON.stringify(request));
                        let body = [];

                        for (let i = 0; i < aes.length; i++) {
                            body.push(aes[i]);
                        }

                        // WOHNZIMMER WRAPPER
                        let wrapper = {
                            "name": "callCommon",
                            "args": [{
                                "Session_Id": +SESSION_ID,
                                "body": `[${body.join(", ")}]`
                            }]
                        };

                        ws.send(`5::/com.samsung.companion:${JSON.stringify(wrapper)}`);
                        done(null, true)

                    });
                });

            });

        })

    });




};