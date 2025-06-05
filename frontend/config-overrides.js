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

  // Configure module resolution
  config.resolve = {
    ...config.resolve,
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.json'],
    mainFields: ['browser', 'module', 'main'],
    alias: {
      ...config.resolve.alias,
      '@mui/material/styles': '@mui/material/styles/index.js',
    }
  };

  // Add a rule to handle .mjs files
  config.module.rules.push({
    test: /\.m?js/,
    resolve: {
      fullySpecified: false
    }
  });

  return config;
};
