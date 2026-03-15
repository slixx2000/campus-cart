const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = Array.from(new Set([...(config.watchFolders ?? []), workspaceRoot]));
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Force a single copy of React (and react-dom/react-native) so root node_modules
// packages (using React 18) and mobile source (using React 19) share one instance.
// Without this, two React copies produce incompatible element shapes and crash at runtime.
const DEDUPE_PACKAGES = new Set(["react", "react-dom", "react-native"]);
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const packageName = moduleName.split("/")[0];
  if (DEDUPE_PACKAGES.has(packageName)) {
    return {
      filePath: require.resolve(moduleName, { paths: [projectRoot] }),
      type: "sourceFile",
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
