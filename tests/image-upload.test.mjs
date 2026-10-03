import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { assertUploadOrigin, readLimitedBody, normalizeImage, MAX_IMAGE_BYTES } from '../src/lib/storage/image-upload.ts';

test('requires explicit matching origin, never trusting Host', () => {
  assertUploadOrigin(new Request('http://internal/api', {headers:{origin:'https://kwonnet.com'}}), 'https://kwonnet.com');
  for (const origin of [undefined, 'https://evil.com', 'null', 'https://kwonnet.com.evil.com']) {
    assert.throws(() => assertUploadOrigin(new Request('https://kwonnet.com/api', {headers: origin ? {origin} : {}}), 'https://kwonnet.com'), {status:403});
  }
  assert.throws(() => assertUploadOrigin(new Request('http://internal/api'), undefined), {status:503});
});
test('rejects empty and oversized bodies including chunked requests', async () => {
  await assert.rejects(readLimitedBody(new Request('http://localhost', {method:'POST'})), {status:400});
  await assert.rejects(readLimitedBody(new Request('http://localhost', {method:'POST', headers:{'content-length':String(MAX_IMAGE_BYTES+1)}})), {status:413});
  const body = new ReadableStream({start(c){c.enqueue(new Uint8Array(MAX_IMAGE_BYTES)); c.enqueue(new Uint8Array(1)); c.close();}});
  await assert.rejects(readLimitedBody(new Request('http://localhost', {method:'POST',body,duplex:'half'})), {status:413});
  assert.equal((await readLimitedBody(new Request('http://localhost', {method:'POST',body:'abc'}))).toString(), 'abc');
});
test('rejects arbitrary bytes and active SVG regardless of MIME', async () => {
  for (const bytes of ['<html>evil</html>', '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>']) await assert.rejects(normalizeImage(Buffer.from(bytes)), {status:400});
});
test('re-encodes PNG to WebP with correct dimensions and without EXIF', async () => {
  const bytes = await sharp({create:{width:12,height:8,channels:3,background:'red'}}).withMetadata().png().toBuffer();
  const image = await normalizeImage(bytes);
  assert.equal(image.width,12); assert.equal(image.height,8);
  const metadata = await sharp(image.data).metadata();
  assert.equal(metadata.format,'webp'); assert.equal(metadata.exif,undefined);
});
test('rejects truncated images', async () => {
  const bytes = await sharp({create:{width:12,height:8,channels:3,background:'red'}}).png().toBuffer();
  await assert.rejects(normalizeImage(bytes.subarray(0,30)), {status:400});
});

test('handler authenticates before reading or storing, and ignores client identity', async () => {
  const { createImageUploadHandler } = await import('../src/lib/storage/image-upload.ts');
  const png = await sharp({create:{width:2,height:3,channels:3,background:'blue'}}).png().toBuffer();
  const request = (body = png) => new Request('https://kwonnet.com/api/uploads/images?userId=victim&path=evil', {method:'POST',headers:{origin:'https://kwonnet.com'},body});
  let calls = 0;
  const store = async (id, image) => { calls++; assert.equal(id,'authenticated-user'); assert.equal(image.width,2); return {url:'https://media.example.com/random.webp'}; };
  const unauthorized = createImageUploadHandler({appUrl:()=> 'https://kwonnet.com',userId:async()=>undefined,store});
  assert.equal((await unauthorized(request())).status,401); assert.equal(calls,0);
  const handler = createImageUploadHandler({appUrl:()=> 'https://kwonnet.com',userId:async()=> 'authenticated-user',store});
  assert.equal((await handler(request('invalid'))).status,400); assert.equal(calls,0);
  const result = await handler(request());
  assert.equal(result.status,200); assert.equal(calls,1); assert.equal((await result.json()).url,'https://media.example.com/random.webp');
  for(let i=0;i<28;i++) await handler(request('invalid'));
  assert.equal((await handler(request())).status,429);
});

test('storage failures return a safe error without leaking credentials', async () => {
  const { createImageUploadHandler } = await import('../src/lib/storage/image-upload.ts');
  const bytes = await sharp({create:{width:2,height:2,channels:3,background:'red'}}).png().toBuffer();
  const handler = createImageUploadHandler({appUrl:()=> 'https://kwonnet.com',userId:async()=> 'user',store:async()=>{throw new Error('SECRET_KEY');}});
  const response = await handler(new Request('https://kwonnet.com/api/uploads/images',{method:'POST',headers:{origin:'https://kwonnet.com'},body:bytes}));
  assert.equal(response.status,503); assert.ok(!(await response.text()).includes('SECRET_KEY'));
});

test('slow request bodies release their upload slot by timing out', async () => {
  const body = new ReadableStream({ start() {} });
  await assert.rejects(readLimitedBody(new Request('http://localhost', {method:'POST',body,duplex:'half'}), 5), {status:408});
});
