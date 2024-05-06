const WebSocket = require("ws");

const request = require("../../helper/request.js");

module.exports = (iface, complete) => {

    let { host, port } = iface.settings;
   
    
    iface.on("attached", () => {

        console.log("iface attacehd");
        let agent = iface.httpAgent({}, "http");
        request(`http://${host}:${port}/socket.io/1/?t=${Date.now()}`, {
            agent
        }, (err, result) => {
            if (err) {

                console.error(err);
                process.exit(1);

            } else {

                let start = null;
                let wsp = result.body.toString().split(":")[0];

                console.log("WS GET", wsp)
                let agent = iface.httpAgent({}, "ws");
                let ws = new WebSocket(`ws://${host}:${port}/socket.io/1/websocket/${wsp}`, {
                    agent
                });

                ws.on("error", (err) => {
                    console.log("Handhsake error", err);
                    process.exit(123);
                });

                ws.on("close", () => {
                    console.log("Disconnected from ", ws.url, "Duration: ", Date.now() - start);
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
                        start = Date.now();
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

            }
        });

    });

};