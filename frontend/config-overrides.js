module.exports = function override(config, env) {
  // Add fallbacks for Node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    http: require.resolve("stream-http"),
    https: require.resolve("https-browserify"),
    stream: require.resolve("stream-browserify"),
    zlib: require.resolve("browserify-zlib"),
    util: require.resolve("util/"),
    url: require.resolve("url/"),
  };

  // Modify module resolution for MUI
  config.resolve.mainFields = ['browser', 'module', 'main'];
  
  // Add a rule to handle MUI imports
  config.module.rules.push({
    test: /\.m?js/,
    resolve: {
      fullySpecified: false
    }
  });

  return config;
};
