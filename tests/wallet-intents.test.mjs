import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prepareWalletIntent,completeWalletIntent} from '../src/utils/wallet-intents.ts';
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}};
test('concurrent retries and reloads share one intent until success',async()=>{
 const s=storage(),body={amount:100,recipientId:'r'};
 const intents=await Promise.all(Array.from({length:10},()=>prepareWalletIntent('u','/v1/wallets/transfer',body,s)));
 assert.equal(new Set(intents.map(i=>i.key)).size,1);
 const retry=await prepareWalletIntent('u','/v1/wallets/transfer',{recipientId:'r',amount:100},s);
 assert.equal(retry.key,intents[0].key);
 completeWalletIntent(retry.slot,retry.key,s);
 assert.notEqual((await prepareWalletIntent('u','/v1/wallets/transfer',body,s)).key,retry.key);
});
test('accounts and genuinely changed requests get different identities',async()=>{
 const s=storage();const a=await prepareWalletIntent('u','route',{amount:1},s);
 assert.notEqual((await prepareWalletIntent('v','route',{amount:1},s)).key,a.key);
 assert.notEqual((await prepareWalletIntent('u','route',{amount:2},s)).key,a.key);
});
test('unavailable persistence fails before a charge can be sent',async()=>{
 await assert.rejects(prepareWalletIntent('u','route',{}, {getItem(){throw new Error('blocked')},setItem(){}}));
});
