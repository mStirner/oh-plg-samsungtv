const WebSocket = require("ws");

const request = require("../../helper/request.js");
const infinity = require("../../helper/infinity.js");

module.exports = (ifaceHTTP, ifaceWS, complete) => {
    infinity((redo) => {
        Promise.all([

            new Promise((resolve) => {
                ifaceHTTP.once("attached", resolve);
                ifaceHTTP.once("close", redo);
            }),

            new Promise((resolve) => {
                ifaceWS.once("attached", resolve);
                ifaceWS.once("close", redo);
            }),

        ]).then(async () => {

            // receive websocket handshake
            new Promise((resolve, reject) => {

                let agent = ifaceHTTP.httpAgent();
                let { host, port } = ifaceHTTP.settings;

                request(`http://${host}:${port}/socket.io/1/?t=${Date.now()}`, {
                    agent
                }, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result.body.toString().split(":")[0]);
                    }
                });

            }, redo).then((wsp) => {


                let agent = ifaceWS.httpAgent();
                let { host, port } = ifaceWS.settings;

                let ws = new WebSocket(`ws://${host}:${port}/socket.io/1/websocket/${wsp}`, {
                    agent
                });

                ws.on("error", (err) => {
                    console.log("Handhsake error", err);
                    redo();
                });

                ws.on("close", () => {
                    console.log("Disconnected from ", ws.url, "Duration: ", Date.now() - start);
                    redo();
                });

                ws.on("open", () => {
                    console.log("Connected to ", ws.url);
                });

                ws.on("message", (msg) => {

                    let str = msg.toString();
                    console.log("MSG >", str)

                    if (str === "1::") {

                        // received greeings from tv
                        // send hello
                        console.log("Received greeting from tv");
                        ws.send("1::/com.samsung.companion");

                    } else if (str === "1::/com.samsung.companion") {

                        // received hello from tv
                        // handshake completed
                        console.log("Handshake completed");
                        complete(ws);

                    } else if (str === "2::") {

                        // received keep alive from tv
                        // send keep alive to tv
                        console.log("Received keep alive from tv");
                        ws.send("2::");

                    } else {

                        console.log("str", str);

                    }

                });

            });

        }).catch((err) => {

            console.error(err);

            redo();

        });
    }, 5000);
};