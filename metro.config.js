// // metro.config.js

// // Learn more https://docs.expo.io/guides/customizing-metro
// const { getDefaultConfig } = require("expo/metro-config");
// const resolveFrom = require("resolve-from");

// /** @type {import('expo/metro-config').MetroConfig} */
// const config = getDefaultConfig(__dirname);

// config.resolver.resolveRequest = (context, moduleName, platform) => {
//   if (
//     moduleName === "event-target-shim" &&
//     context.originModulePath.includes("react-native-webrtc")
//   ) {
//     const eventTargetShimPath = resolveFrom(
//       context.originModulePath,
//       "event-target-shim/index.js"
//     );

//     return {
//       filePath: eventTargetShimPath,
//       type: "sourceFile",
//     };
//   }

//   // Default resolver
//   return context.resolveRequest(context, moduleName, platform);
// };

// module.exports = config;
const { getDefaultConfig } = require("@expo/metro-config");

// Extend the default Metro configuration for Expo
const defaultConfig = getDefaultConfig(__dirname);

module.exports = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    sourceExts: [
      ...defaultConfig.resolver.sourceExts,
    ],
  
  },
};
