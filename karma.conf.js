module.exports = function (config) {
  config.set({
    frameworks: ["esm"],
    files: [{ pattern: "index.spec.js", type: "module" }],
    reporters: ["progress"],
    autoWatch: true,
    colors: true,
    plugins: [require.resolve("@open-wc/karma-esm")],
    // Browsers available include:
    // - Chrome and ChromeCanary (install `karma-chrome-launcher`)
    // - Firefox (install `karma-firefox-launcher` first)
    // - Opera  (install `karma-opera-launcher` first)
    // - Safari (install `karma-safari-launcher` first)
    // - IE (install `karma-ie-launcher` first)
    // - PhantomJS  (install `karma-phantomjs-launcher`)
    browsers: ["ChromeHeadless"],
  });
};
