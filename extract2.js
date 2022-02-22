const ts = require("typescript");
const fs = require("fs");
const { createService } = require("./create-service");
const { visitChildNode } = require("./visit-child-node");

const service = createService();

// 查找声明节点中的函数调用节点
function getFunctionCallInFunctionDeclare(node, sourceFile, result = []) {
  if (ts.isCallLikeExpression(node)) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      result.push(node);
    } else {
      result.push(node);
    }
  }
  node.forEachChild((child) => {
    getFunctionCallInFunctionDeclare(child, sourceFile, result);
  });
  return result;
}

// 一些不需要的类型要忽略
function isExcludedInfo(info) {
  if (!info) return true;
  // try catch(error)忽略
  // 函数参数声明忽略
  return ["local var", "parameter"].includes(info.kind);
}

// 查找函数声明的位置（代码实现）
function findImplementation(filename, positionStart) {
  let result;
  try {
    result =
      service.getImplementationAtPosition(filename, positionStart + 1) ||
      service.getDefinitionAtPosition(filename, positionStart + 1);
  } catch (error) {
    console.log(error.message);
  }

  const info = result && result[0];

  if (!info) {
    return undefined;
  }

  if (isExcludedInfo(info)) {
    return undefined;
  }

  return info;
}

function getInfoStart(info) {
  if (!info) return;
  if (info.contextSpan) {
    return info.contextSpan.start;
  }
  return info.textSpan.start;
}

// 是否是代码声明
function isDeclaration(node) {
  return (
    ts.isVariableDeclaration(node) ||
    ts.isClassDeclaration(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isVariableStatement(node) ||
    ts.isFunctionExpression(node) ||
    ts.isClassDeclaration(node)
  );
}

function getRootNodes(sourceFile) {
  let rootNodes = [];
  sourceFile.forEachChild(function (child) {
    rootNodes.push(child);
  });
  return rootNodes;
}

function findNodeByPositionWorker(node, sourceFile, targetStart) {
  let targetNode;

  if (node.getStart(sourceFile) === targetStart) {
    targetNode = node;
    return targetNode;
  }

  node.forEachChild(function (child) {
    targetNode = findNodeByPositionWorker(child, sourceFile, targetStart);
  });
  return targetNode;
}

function findNodeByPosition(filename, targetStart) {
  const sourceFile = createSourceFile(filename);
  const rootNodes = getRootNodes(sourceFile);

  let result;
  rootNodes.some(function (node) {
    result = findNodeByPositionWorker(node, sourceFile, targetStart);
    return !!result;
  });

  return result;
}

function createSourceFile(filename) {
  const sourceContent = fs.readFileSync(filename).toString();
  const sourceFile = ts.createSourceFile(
    filename,
    sourceContent,
    ts.ScriptTarget.Latest
  );

  return sourceFile;
}

function getIdentifierNode(node, sourceFile) {
  let identifierNode;
  if (ts.isIdentifier(node)) {
    identifierNode = node;
  } else if (ts.isPropertyAccessExpression(node)) {
    const childChildren = node.getChildren(sourceFile);
    identifierNode = childChildren[childChildren.length - 1];
  }
  return identifierNode;
}

class ExtractFunctionCalls {
  constructor() {}

  findCallChainWorker(identifierNode, filename, result) {
    const sourceFile = createSourceFile(filename);
    let startPosition = identifierNode.getStart(sourceFile);

    const implementation = findImplementation(filename, startPosition);
    if (implementation) {
      const implementationFilename = implementation.fileName;
      const implementationStart = getInfoStart(implementation);
      // 找到其AST node
      const implementationNode = findNodeByPosition(
        implementationFilename,
        implementationStart
      );
      if (implementationNode) {
        if (isDeclaration(implementationNode)) {
          // 递归检查该AST node
          // console.log("递归检查该AST node");
          const allFunctionCallNodes = getFunctionCallInFunctionDeclare(
            implementationNode,
            sourceFile
          );
          // 递归终止，没有函数调用
          if (!allFunctionCallNodes.length) {
            return { [identifierNode.getText(sourceFile)]: {} };
          }
          allFunctionCallNodes.forEach((functionCallNode) => {
            functionCallNode.forEachChild((child) => {
              if (
                ts.isIdentifier(child) ||
                ts.isPropertyAccessExpression(child)
              ) {
                const childIdentifierNode = getIdentifierNode(
                  child,
                  sourceFile
                );
                const childIdentifierNodeName =
                  identifierNode.getText(sourceFile);

                const childCallChain = this.findCallChainWorker(
                  childIdentifierNode,
                  implementationFilename,
                  {}
                );
                result[childIdentifierNodeName] = childCallChain;
              }
            });
          });
        } else {
          // console.log(
          //   '--->不是声明',
          //   functionName
          // )
        }
      } else {
        // console.log(
        //   '----------->找不到implementationNode'
        // )
      }
    } else {
      console.log("----------->找不到implementation");
    }

    return result;
  }

  findCallChain(identifierNode, filename) {
    const result = this.findCallChainWorker(identifierNode, filename, {});

    return result;
  }

  findIdentifierNodeByName(willFindFunctionName, filename) {
    const sourceFile = createSourceFile(filename);
    const rootDeclaredNodes = getRootNodes(sourceFile);

    let functionCallNode;

    for (let i = 0; i < rootDeclaredNodes.length; i++) {
      let nodeItem = rootDeclaredNodes[i];
      visitChildNode(nodeItem, (node) => {
        if (!ts.isCallLikeExpression(node)) {
          return;
        }
        node.forEachChild((child) => {
          if (functionCallNode) {
            return;
          }

          if (ts.isIdentifier(child) || ts.isPropertyAccessExpression(child)) {
            const identifierNode = getIdentifierNode(child, sourceFile);
            const functionName = identifierNode.getText(sourceFile);

            if (functionName === willFindFunctionName) {
              functionCallNode = child;
            }
          }
        });

        if (functionCallNode) {
          return false;
        }
      });

      if (functionCallNode) {
        break;
      }
    }

    return functionCallNode;
  }

  run(functionName, filename) {
    const identifierNode = this.findIdentifierNodeByName(
      functionName,
      filename
    );

    if (!identifierNode) {
      console.log(`文件 ${filename} 中找不到 ${functionName} 的函数调用`);
      return {};
    }

    return this.findCallChain(identifierNode, filename);
  }
}

const extractFunctionCalls = new ExtractFunctionCalls();

const result = extractFunctionCalls.run("myName", "src/test-call-chain2.ts");

console.log(JSON.stringify(result, null, 2));
