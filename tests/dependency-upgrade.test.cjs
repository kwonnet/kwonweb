const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
function load(file, overrides = {}) {
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => name in overrides ? overrides[name] : require(name), module, module.exports);
  return module.exports;
}

test('Zod 4 keeps transfer validation and error messages', () => {
  const { TransferZodSchema: schema } = load('src/schema/coins.ts');
  assert.deepEqual(schema.parse({ senderId: ' sender ', recipientId: ' recipient ', amount: 100 }), { senderId: 'sender', recipientId: 'recipient', amount: 100 });
  for (const amount of [undefined, '100', NaN, Infinity]) {
    const result = schema.safeParse({ senderId: 'sender', recipientId: 'recipient', amount });
    assert.equal(result.success, false);
    assert.equal(result.error.issues[0].message, 'Amount must be a number');
  }
  assert.equal(schema.safeParse({ senderId: 'sender', recipientId: 'recipient', amount: 99 }).error.issues[0].message, 'Minimum amount is 100 Coins');
});
