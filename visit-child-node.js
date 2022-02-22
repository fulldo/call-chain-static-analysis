module.exports.visitChildNode = function visitChildNode(node, visitCallback) {
  if (!node) {
    return;
  }
  node.forEachChild((child) => {
    // 递归遍历
    const visitNext = visitCallback && visitCallback(child);
    // 如果回调函数返回 false，停止遍历
    if (visitNext !== false) {
      visitChildNode(child);
    }
  });
};
