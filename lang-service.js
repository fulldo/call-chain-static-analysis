const { createService } = require("./create-service");

const service = createService();

console.log(service.getDefinitionAtPosition("src/test-call-chain2.ts", 52));

console.log(service.getDefinitionAtPosition("src/index2.ts", 30));

console.log(service.getDefinitionAtPosition("src/index.ts", 43));

console.log(service.getReferencesAtPosition("src/index.ts", 21));
