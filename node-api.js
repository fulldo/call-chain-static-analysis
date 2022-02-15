const ts = require("typescript");

const codeAsString = `ReactDOM.render(
  <h1>Hello, world!</h1>,
  document.getElementById('root')
);
`;
const sourceFile = ts.createSourceFile(
  "index.ts",
  codeAsString,
  ts.ScriptTarget.Latest
);

const rootNode = sourceFile;

console.log(rootNode.getChildCount());
// 2
console.log(rootNode.getChildAt(0, sourceFile).getText(sourceFile));
/**
ReactDOM.render(
  <h1>Hello, world!</h1>,
  document.getElementById('root')
);
 */
console.log(rootNode.getStart(sourceFile));
// 0
console.log(rootNode.getFullStart());
// 0
console.log(rootNode.getEnd());
// 80
console.log(rootNode.getWidth());
// 80
console.log(rootNode.getFullWidth());
// 80
console.log(rootNode.getText());
/**
ReactDOM.render(
  <h1>Hello, world!</h1>,
  document.getElementById('root')
);
 */
