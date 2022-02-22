module.exports.visitChildNode = function visitChildNode(node, visitCallback) {
  if (!node) {
    return;
  }
  node.forEachChild((child) => {
    const visitNext = visitCallback && visitCallback(child);
    if (visitNext !== false) {
      visitChildNode(child);
    }
  });
};
