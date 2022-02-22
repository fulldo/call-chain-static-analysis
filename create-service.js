const fs = require("fs");
const ts = require("typescript");
const path = require("path");

const parseTsConfigJson = (tsconfigPath) => {
  const basePath = path.resolve(path.dirname(tsconfigPath));

  const parseJsonResult = ts.parseConfigFileTextToJson(
    tsconfigPath,
    fs.readFileSync(tsconfigPath, { encoding: "utf-8" })
  );

  const tsConfig = ts.parseJsonConfigFileContent(
    parseJsonResult.config,
    ts.sys,
    basePath
  );

  return tsConfig;
};

const createService = () => {
  // tsconfig.json文件的路径
  const config = parseTsConfigJson("tsconfig.json");
  const rootFileNames = new Set(config.fileNames);
  const fileVersions = new Map(
    Array.from(rootFileNames).map((fileName) => [fileName, 0])
  );
  const service = ts.createLanguageService(
    {
      getScriptFileNames: () => Array.from(rootFileNames),
      getScriptVersion: (fileName) => {
        const version = fileVersions.get(fileName);
        return version ? version.toString() : "";
      },
      getScriptSnapshot: (fileName) => {
        if (!fs.existsSync(fileName)) {
          return undefined;
        }

        return ts.ScriptSnapshot.fromString(
          fs.readFileSync(fileName).toString()
        );
      },
      getCurrentDirectory: () => process.cwd(),
      getCompilationSettings: () => ({
        ...config.options,
        sourceMap: false,
        target: 3,
      }),
      getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
      fileExists: ts.sys.fileExists,
      readFile: ts.sys.readFile,
      readDirectory: ts.sys.readDirectory,
      directoryExists: ts.sys.directoryExists,
      getDirectories: ts.sys.getDirectories,
    },
    ts.createDocumentRegistry()
  );
  return service;
};
module.exports.createService = createService;
