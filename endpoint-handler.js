const crypto = require("crypto");

const handshake = require("./handshake.js");

const UUID = "samtv";
//var SESSION_ID = null;
//var SESSION_KEY = null;



module.exports = (logger, [
    device,
    C_ENDPOINTS,
    C_VAULT
]) => {

    C_ENDPOINTS.found({
        device: device._id
    }, async (endpoint) => {

        C_VAULT.found({
            labels: [
                `endpoint=${endpoint._id}`,
                `device=${device._id}`,
                "samsung=true",
                "tv=true"
            ]
        }, (vault) => {

            /*
            let vault = await C_VAULT.find({
                labels: [
                    `endpoint=${endpoint._id}`,
                    `device=${device._id}`,
                    "samsung=true",
                    "tv=true"
                ]
            });
            */

            let changes = vault.changes();

            Promise.all([

                new Promise((resolve) => {

                    // TODO: Check if try/catch here is necassary
                    // or is it picked up by the promisese callback wrapper
                    logger.debug('(Waiting for) decrypt secret "session_key"');

                    let sessionKey = vault.secrets.find(({ key }) => {
                        return key === "session_key";
                    });

                    if (sessionKey.value === null) {

                        let eventHandler = ({ key }) => {
                            if (key === "session_key") {

                                changes.off("changed", eventHandler);
                                resolve(sessionKey.decrypt());

                            }
                        };

                        changes.on("changed", eventHandler);

                    } else {

                        resolve(sessionKey.decrypt());

                    }

                }).then((value) => {
                    logger.debug(`Vault secret "session_key" decrypted`);
                    return value;
                }),

                new Promise((resolve) => {

                    // TODO: Check if try/catch here is necassary
                    // or is it picked up by the promisese callback wrapper
                    logger.debug('(Waiting for) decrypt secret "session_id"');

                    let sessionId = vault.secrets.find(({ key }) => {
                        return key === "session_id";
                    });

                    if (sessionId.value === null) {

                        let eventHandler = ({ key }) => {
                            if (key === "session_id") {

                                changes.off("changed", eventHandler);
                                resolve(sessionId.decrypt());

                            }
                        };

                        changes.on("changed", eventHandler);

                    } else {

                        resolve(sessionId.decrypt());

                    }

                }).then((value) => {
                    logger.debug(`Vault secret "session_id" decrypted`);
                    return value;
                })

            ]).then(([SESSION_KEY, SESSION_ID]) => {

                console.log(`SEESION_KEY=${SESSION_KEY}`);
                console.log(`SESSION_ID=${SESSION_ID}`);

                const aesEncrypt = ((val, algo = "aes-128-ecb") => {
                    let cipher = crypto.createCipheriv(algo, Buffer.from(SESSION_KEY, 'hex'), null);
                    return Buffer.concat([cipher.update(val, 'utf8'), cipher.final()]);
                });

                const aesDecrypt = ((val, algo = "aes-128-ecb") => {
                    let decipher = crypto.createDecipheriv(algo, Buffer.from(SESSION_KEY, 'hex'), null);
                    return Buffer.concat([decipher.update(val), decipher.final()]);
                });


                let ifaceHTTP = device.interfaces.find(({ settings: { port }, description }) => {
                    return port === 8000 && description === "SmartView HTTP API";
                });

                let ifaceWS = device.interfaces.find(({ settings: { port }, description }) => {
                    return port === 8000 && description === "SmartView WS API";
                });

                handshake(ifaceHTTP, ifaceWS, (ws) => {

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

                            ws.send(`5::/com.samsung.companion:${JSON.stringify(wrapper)}`, (err) => {
                                if (err) {

                                    done(err, true);

                                } else {

                                    ws.once("message", (msg) => {
                                        try {

                                            msg = msg.toString();
                                            let prefix = "5::/com.samsung.companion:";

                                            if (msg.startsWith(prefix)) {

                                                let success = '{"plugin":"RemoteControl","api":"SendRemoteKey","result":{}}';
                                                let json = JSON.parse(msg.substring(prefix.length));
                                                let data = Buffer.from(JSON.parse(json.args));

                                                done(null, aesDecrypt(data).toString() === success);

                                            } else {

                                                done(null, false);

                                            }

                                        } catch (err) {
                                            done(err, false);
                                        }
                                    });

                                }
                            });


                        });
                    });

                });

            }).catch((err) => {

                console.log("Error", err);
                logger.error(err, "Could not setup crypto stuff/endpoint handling");

            });


        }, (filter) => {

            logger.warn(`No secrets vault found device/endpoint ${device._id}/${endpoint._id} - (${device.name}/${endpoint.name})`, filter);

        });

    });

};