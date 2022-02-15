const ts = require("typescript");

const source = "let x: string = 'string'";

let result = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});

console.log(result.outputText);
