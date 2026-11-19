const { getDefaultConfig } = require("expo/metro-config");
const devProxy = require("./scripts/devProxy");

const config = getDefaultConfig(__dirname);

// Dev only: the live-website proxy for the citation drawer (see scripts/devProxy.js).
const enhance = config.server?.enhanceMiddleware;
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) =>
    devProxy(enhance ? enhance(middleware, server) : middleware),
};

module.exports = config;
