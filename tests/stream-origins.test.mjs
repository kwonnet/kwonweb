import test from 'node:test';
import assert from 'node:assert/strict';
import {updateStreamOrigins} from '../scripts/update-stream-origins.mjs';
import {createStreamService} from '../src/lib/storage/stream.ts';
const accountId='a'.repeat(32),uid='b'.repeat(32),token='private-token';
test('bulk origin dry-run is read-only and reports the videos needing changes',async()=>{
 const calls=[];
 const result=await updateStreamOrigins({accountId,token,fetcher:async(url,options)=>{calls.push({url,options});return Response.json({success:true,result:[{uid,allowedOrigins:['kwonnet.com']}]});},backup:()=>{throw new Error('Dry run must not write files');}});
 assert.equal(result.needsUpdate,1);assert.equal(result.updated,0);assert.equal(calls.length,1);assert.equal(calls[0].options.method,undefined);assert.ok(!JSON.stringify(result).includes(token));
});
test('bulk origin update saves original settings, preserves other video settings and verifies the provider response',async()=>{
 const calls=[],backups=[];
 const result=await updateStreamOrigins({accountId,token,apply:true,backup:async(...args)=>backups.push(args),fetcher:async(url,options)=>{
  calls.push({url,options});
  if(!options.method)return Response.json({success:true,result:[{uid,allowedOrigins:['kwonnet.com'],requireSignedURLs:true}]});
  assert.equal(backups.length,1);assert.deepEqual(JSON.parse(options.body),{uid,allowedOrigins:['kwonnet.com','*.kwonnet.com']});
  return Response.json({success:true,result:{uid,allowedOrigins:['kwonnet.com','*.kwonnet.com'],requireSignedURLs:true}});
 }});
 assert.equal(result.updated,1);assert.deepEqual(JSON.parse(backups[0][1]),[{uid,allowedOrigins:['kwonnet.com']}]);assert.equal(calls.length,2);
});
test('new uploads never receive an upload URL if wildcard playback configuration fails',async()=>{
 const config={accountId,token,appUrl:'https://beta.kwonnet.com',maxDuration:600};
 for(const response of [Response.json({success:false},{status:403}),Response.json({success:true,result:{allowedOrigins:['beta.kwonnet.com']}})]){
  const service=createStreamService(config,async(url)=>url.includes('direct_user=true')?new Response(null,{status:201,headers:{Location:`https://upload.videodelivery.net/${uid}`,'stream-media-id':uid}}):response);
  await assert.rejects(service.create('user',{name:'video.mp4',type:'video/mp4',size:100}),error=>error.status>=500&&!error.message.includes(token));
 }
});
