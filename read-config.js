const ts = require("typescript");
const path = require("path");

const jsonText = `{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "moduleResolution": "node",
    "jsx": "react"
  },
  "include": ["src"]
}`;

console.log(ts.parseConfigFileTextToJson("tsconfig.json", jsonText));

const tsParsedConfig = ts.readJsonConfigFile("tsconfig.json", ts.sys.readFile);
const compilerOptions = ts.parseJsonSourceFileConfigFileContent(
  tsParsedConfig,
  ts.sys,
  path.dirname("tsconfig.json")
).options;

console.log(compilerOptions);
