module.exports = (info, logger, init) => {
    return init([
        "devices",
        "endpoints",
        "vault"
    ], (scope, [
        C_DEVICES,
        C_ENDPOINTS,
        C_VAULT
    ]) => {

        // feedback
        console.log("Hello World", info);

        require("./device-handler.js")(logger, [
            C_DEVICES,
            C_ENDPOINTS,
            C_VAULT
        ]);

    });
};