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

        require("./device-handler.js")(logger, [
            C_DEVICES,
            C_ENDPOINTS,
            C_VAULT
        ]);

    });
};