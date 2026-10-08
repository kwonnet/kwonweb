const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const mod = {exports: {}};
const source = ts.transpileModule(readFileSync(path.join(__dirname, '../src/lib/signal/attachments.ts'), 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
}).outputText;
new Function('exports', source)(mod.exports);
const {encryptAttachment, decryptAttachment} = mod.exports;
const file = () => new File([new Uint8Array([1, 2, 3, 4])], 'photo.png', {type: 'image/png'});
test('attachment round trip preserves bytes and uses fresh keys and IVs', async () => {
  const a = await encryptAttachment(file(), 'conversation-a', 'blob-a');
  const b = await encryptAttachment(file(), 'conversation-a', 'blob-b');
  assert.notEqual(a.secret.keyB64, b.secret.keyB64); assert.notEqual(a.secret.ivB64, b.secret.ivB64);
  assert.equal(a.blob.type, 'application/octet-stream');
  const clear = await decryptAttachment(a.secret, await a.blob.arrayBuffer(), 'conversation-a');
  assert.deepEqual(new Uint8Array(await clear.arrayBuffer()), new Uint8Array([1, 2, 3, 4]));
});
test('wrong conversation and blob context cannot decrypt', async () => {
  const a = await encryptAttachment(file(), 'conversation-a', 'blob-a');
  const bytes = await a.blob.arrayBuffer();
  await assert.rejects(decryptAttachment(a.secret, bytes, 'conversation-b'));
  await assert.rejects(decryptAttachment({...a.secret, blobId: 'blob-b'}, bytes, 'conversation-a'));
});
test('ciphertext tamper and truncation fail', async () => {
  const a = await encryptAttachment(file(), 'conversation-a', 'blob-a');
  const bytes = new Uint8Array(await a.blob.arrayBuffer()); bytes[0] ^= 1;
  await assert.rejects(decryptAttachment(a.secret, bytes.buffer, 'conversation-a'));
  await assert.rejects(decryptAttachment(a.secret, bytes.slice(1).buffer, 'conversation-a'));
});
test('invalid key, IV, MIME and plaintext length fail', async () => {
  const a = await encryptAttachment(file(), 'conversation-a', 'blob-a');
  const bytes = await a.blob.arrayBuffer();
  for (const override of [{keyB64: 'AAAA'}, {ivB64: 'AAAA'}, {mime: 'text/html'}, {plaintextBytes: 3}])
    await assert.rejects(decryptAttachment({...a.secret, ...override}, bytes, 'conversation-a'));
});
test('active and oversized attachments are rejected before encryption', async () => {
  await assert.rejects(encryptAttachment(new File(['<script>'], 'x.html', {type: 'text/html'}), 'a', 'b'));
  await assert.rejects(encryptAttachment(new File([new Uint8Array(8 * 1024 * 1024 + 1)], 'x.png', {type: 'image/png'}), 'a', 'b'));
});
