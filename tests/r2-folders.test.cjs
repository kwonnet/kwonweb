const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const ts = require('typescript');

test('R2 writes profile, banner and default post images into separate account-scoped folders', async () => {
  const config = { CLOUDFLARE_ACCOUNT_ID: 'a'.repeat(32), CLOUDFLARE_ACCESS_KEY: 'test-key', CLOUDFLARE_SECRET_KEY: 'test-secret', CLOUDFLARE_BUCKET_NAME: 'test-bucket', CLOUDFLARE_PUBLIC_MEDIA_URL: 'https://media.kwonnet.test', CLOUDFLARE_S3_API_ENDPOINT: '' };
  const previous = Object.fromEntries(Object.keys(config).map(key => [key, process.env[key]]));
  Object.assign(process.env, config);
  const sent = [], module = { exports: {} };
  const mocks = { 'server-only': {}, '@aws-sdk/client-s3': {
    S3Client: class { async send(command) { sent.push(command.input); } },
    PutObjectCommand: class { constructor(input) { this.input = input; } },
  } };
  const code = ts.transpileModule(readFileSync('src/lib/storage/r2.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'module', 'exports', code)(id => id in mocks ? mocks[id] : require(id), module, module.exports);
  try {
    const image = { data: Buffer.from('normalized-image'), width: 512, height: 512 };
    const owner = createHash('sha256').update('owner').digest('hex');
    for (const folder of [undefined, 'profiles', 'banners']) {
      const result = await module.exports.storeImage('owner', image, folder);
      assert.match(result.filePath, new RegExp(`^${folder || 'media'}/${owner}/[a-f0-9-]{36}\\.webp$`));
      assert.equal(sent.at(-1).Key, result.filePath);
      assert.equal(result.url, `https://media.kwonnet.test/${result.filePath}`);
      assert.equal(sent.at(-1).Bucket, 'test-bucket');
    }
  } finally { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } }
});
