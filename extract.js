const ts = require("typescript");
const fs = require("fs");

// 函数声明
const allFunctions = [];
// 函数调用 map
const calledFunctions = new Map();

let currentFunction = undefined; // 正在哪个函数中

function extractFunctionCalls(node, sourceFile) {
  // 函数声明如 `function hello()`
  if (ts.isFunctionDeclaration(node)) {
    node.forEachChild((child) => {
      if (ts.isIdentifier(child)) {
        const declaredFunction = child.getText(sourceFile);
        updateDeclaredFunctions(declaredFunction);
      }
    });
  }

  // Arrow function
  if (
    ts.isVariableDeclaration(node) &&
    node.initializer &&
    ts.isArrowFunction(node.initializer)
  ) {
    const child = node.getChildAt(0, sourceFile);
    if (ts.isIdentifier(child)) {
      const declaredFunction = child.getText(sourceFile);
      updateDeclaredFunctions(declaredFunction);
    }
  }

  // 函数调用
  if (ts.isCallExpression(node)) {
    const child = node.getChildAt(0, sourceFile);
    if (ts.isIdentifier(child)) {
      const calledFunction = child.getText(sourceFile);
      updateCalledFunctions(calledFunction);
    }
  }

  // 递归遍历子节点
  node.forEachChild((child) => extractFunctionCalls(child, sourceFile));
}

// 维护函数声明
function updateDeclaredFunctions(declaredFunction) {
  currentFunction = declaredFunction;
  allFunctions.push(declaredFunction);
}

// 更新当前函数调用栈
function updateCalledFunctions(calledFunction) {
  if (calledFunctions.has(currentFunction)) {
    const pastCalls = calledFunctions.get(currentFunction);
    pastCalls.push(calledFunction);
    calledFunctions.set(currentFunction, pastCalls);
  } else {
    calledFunctions.set(currentFunction, [calledFunction]);
  }
}

function processFiles(filenames) {
  filenames.forEach((filename) => {
    // 代码 AST 的第一层节点列表
    const rootNodes = [];

    let codeAsString;

    try {
      codeAsString = fs.readFileSync(filename).toString();
    } catch (err) {
      console.log(err);
    }

    const sourceFile = ts.createSourceFile(
      filename,
      codeAsString,
      ts.ScriptTarget.Latest
    );

    sourceFile.forEachChild((child) => {
      rootNodes.push(child);
    });

    rootNodes.forEach((node) => {
      currentFunction = undefined;
      extractFunctionCalls(node, sourceFile, 1);
    });
  });

  calledFunctions.delete(undefined);

  console.log("");
  console.log("======================================");
  console.log(allFunctions);
  console.log("--------------------------------------");
  console.log(calledFunctions);
  console.log("--------------------------------------");
  console.log("Functions: ", allFunctions.length);
  console.log("Functions 调用: ", calledFunctions.size);
  console.log("--------------------------------------");

  calledFunctions.forEach((value, key) => {
    calledFunctions.set(
      key,
      value.filter((calledFunc) => {
        return allFunctions.includes(calledFunc);
      })
    );
    if (!calledFunctions.get(key).length) {
      calledFunctions.delete(key);
    }
  });

  console.log(calledFunctions);

  const result = {
    allDeclaration: allFunctions,
    calledChain: calledFunctions,
  };

  return result;
}

const processFilesResult = processFiles(["src/test-call-chain.ts"]);

// 处理获取调用栈
function genStack(name, callMap) {
  function gen(n, resultMap) {
    resultMap[n] = {};
    if (callMap.get(n)) {
      callMap.get(n).forEach((item) => {
        gen(item, resultMap[n]);
      });
    }

    return resultMap;
  }

  return gen(name, {});
}

console.log(processFilesResult);

// 获取f3的调用栈
console.log(genStack("f3", processFilesResult.calledChain));
