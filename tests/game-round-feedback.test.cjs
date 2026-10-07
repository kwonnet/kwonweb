const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const {JSDOM} = require('jsdom');
const compile = path => ts.transpileModule(fs.readFileSync(path,'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true}}).outputText;
test('late round feedback preserves membership while fatal errors and explicit exit retain their behavior', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  const prior = {window:global.window, document:global.document, act:global.IS_REACT_ACT_ENVIRONMENT};
  global.window=dom.window; global.document=dom.window.document; global.IS_REACT_ACT_ENVIRONMENT=true;
  const handlers = new Map(), emitted = [], feedback = [];
  let navigations=0, resets=0;
  const socket = {on:(event,handler)=>handlers.set(event,handler), off:(event,handler)=>{if(handlers.get(event)===handler)handlers.delete(event);}, emit:(...args)=>emitted.push(args)};
  const types = {exports:{}};
  new Function('require','module','exports',compile('src/types/index.ts'))(() => ({}),types,types.exports);
  const {GameEventEnum,GameStatusEnum,GameType}=types.exports;
  const gameState = {gameSocketIo:socket,status:GameStatusEnum.PLAY,countdown:2,notifMessage:'',messages:[],roomPlayers:[],isJoined:true,
    gameRoomInfo:{gameType:GameType.TRIVIA},resetState:()=>{resets++;},updateSocketState:()=>{}};
  const ui=({children})=>React.createElement(React.Fragment,null,children);
  const stubs = new Proxy({__esModule:true,default:ui,useTheme:()=>({breakpoints:{down:()=>''}}),useMediaQuery:()=>false},{get:(value,key)=>key in value?value[key]:ui});
  const router={back:()=>{navigations++;}}, notification={show:(...args)=>feedback.push(args)};
  const mocks = {
    '@/types':types.exports,
    '@/hooks':{useAuthSession:()=>({user:{id:'player',username:'player'}})},
    '@/context/GameSocketIoContext':{useGameSocketIoContext:()=>gameState},
    '@/providers/NotificationsProvider':{useNotifications:()=>notification},
    'next/navigation':{useRouter:()=>router},
    'nanoid':{nanoid:()=> 'message-id'},
    'react-idle-timer/legacy':{useIdleTimer:()=>({activate:()=>{}})},
  };
  const module={exports:{}};
  new Function('require','module','exports',compile('src/app/(dashboard)/games/rooms/[id]/PageClient.tsx'))(
    id=>id in mocks?mocks[id]:id.startsWith('@/')||id.startsWith('@mui/')?stubs:require(id),module,module.exports);
  const {createRoot}=require('react-dom/client'); const root=createRoot(document.getElementById('root'));
  try {
    await React.act(async()=>root.render(React.createElement(module.exports.default,{room:{id:'room',name:'Trivia room',catId:'cat',mode:'MULTI'}})));
    for(const message of ['This question is no longer active','Round closed','Answers closed','Voting closed']) {
      await React.act(async()=>handlers.get(GameEventEnum.GAME_ACTION_REJECTED)(message));
      assert.equal(feedback.at(-1)[0],message);
    }
    assert.equal(navigations,0); assert.equal(resets,0);
    assert.equal(emitted.filter(([event])=>event===GameEventEnum.DISCONNECTED).length,0);
    gameState.countdown=15;
    await React.act(async()=>root.render(React.createElement(module.exports.default,{room:{id:'room',name:'Next round',catId:'cat',mode:'MULTI'}})));
    assert.match(document.body.textContent,/Next round/);
    assert.equal(emitted.filter(([event])=>event===GameEventEnum.PLAYER_JOINED).length,0);
    await React.act(async()=>handlers.get(GameEventEnum.GAME_ERROR_NOTIFY)('Wallet unavailable'));
    assert.equal(navigations,1);
    await React.act(async()=>root.unmount());
    assert.equal(resets,1);
    assert.equal(emitted.filter(([event])=>event===GameEventEnum.DISCONNECTED).length,1);
    assert.equal(handlers.has(GameEventEnum.GAME_ACTION_REJECTED),false);
  } finally {
    global.window=prior.window; global.document=prior.document; global.IS_REACT_ACT_ENVIRONMENT=prior.act; dom.window.close();
  }
});
