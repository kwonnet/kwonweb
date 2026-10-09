const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const ts = require('typescript');
const {NextRequest} = require('next/server');
function load(file, mocks) {
  const module = {exports: {}};
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true}}).outputText;
  new Function('require', 'module', 'exports', code)(name => name === '@/lib/seo' ? load('src/lib/seo.ts', {}) : name in mocks ? mocks[name] : require(name), module, module.exports);
  return module.exports;
}
const policy = load('src/lib/auth-redirect.ts', {});
test('legal pages bypass authentication and sanitize spoofed public-route headers', async () => {
  let called = 0;
  const {proxy} = load('src/proxy.ts', {
    './lib/auth-redirect': policy,
    './auth': {auth: async () => async req => {called++; assert.equal(req.headers.get(policy.PUBLIC_LEGAL_HEADER), null); return new Response(null, {status: 401});}},
  });
  for (const path of ['/privacy-policy', '/terms-of-service', '/privacy-policy/']) {
    const response = await proxy(new NextRequest('https://kwonnet.com' + path));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-middleware-request-' + policy.PUBLIC_LEGAL_HEADER), '1');
  }
  assert.equal(called, 0);
  const response = await proxy(new NextRequest('https://kwonnet.com/wallet', {headers: {[policy.PUBLIC_LEGAL_HEADER]: '1'}}));
  assert.equal(response.status, 401); assert.equal(called, 1);
  assert.equal(policy.isPublicLegalPath('/privacy-policy/private'), false);
});
test('legal rendering skips session refresh even with an expired session and omits dashboard auth/realtime gates', async () => {
  const component = () => null;
  const Root = load('src/app/layout.tsx', {
    '@/config/public-env': {publicEnvScript: () => ''}, '@/config': {constant: {siteName: 'Kwonnet'}},
    'next/headers': {headers: async () => new Headers({[policy.PUBLIC_LEGAL_HEADER]: '1'})},
    '@/lib/auth-redirect': policy,
    '@/lib/server-session': {getServerSession: () => {throw new Error('Expired sessions must not block legal pages');}},
    '@/components/common/AppLoadingShell': {__esModule: true, default: component},
    '@mui/material-nextjs/v16-appRouter': {AppRouterCacheProvider: component},
    'next-auth/react': {SessionProvider: component},
    '@/providers/AuthSessionBoundary': {__esModule: true, default: component},
    '@/providers/NextjsAppProvider': {__esModule: true, default: component},
    '@/context/SocketIoContext': {__esModule: true, default: component},
    '@/context/ConvoSocketIoContext': {__esModule: true, default: component},
    '@/context/SSEContext': {__esModule: true, default: component},
    'slick-carousel/slick/slick.css': {}, 'slick-carousel/slick/slick-theme.css': {}, './globals.css': {},
  }).default;
  const legal = {type: 'legal-content'};
  const tree = await Root({children: legal});
  const provider = tree.props.children[1].props.children;
  assert.equal(provider.props.session, null);
  const theme = provider.props.children.props.children;
  assert.equal(theme.props.children, legal);
});


test('legal layout does not pass a function through MUI server/client props', () => {
  const React = require('react');
  const Link = () => null;
  const stub = () => null;
  const Layout = load('src/app/(legal)/layout.tsx', {
    'next/link': {__esModule: true, default: Link},
    '@mui/material': {Box: stub, Container: stub, Divider: stub, Stack: stub, Typography: stub},
  }).default;
  const walk = value => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (!React.isValidElement(value)) return;
    if (value.type !== Link) {
      for (const [name, prop] of Object.entries(value.props)) {
        if (name !== 'children') assert.notEqual(typeof prop, 'function', `Nonserializable ${name} passed across server/client boundary`);
      }
    }
    walk(value.props.children);
  };
  walk(Layout({children: 'Policy content'}));
});

test('LLM overview and all sitemap assets bypass login while unrelated sitemap paths stay guarded',async()=>{
 let called=0;
 const {proxy}=load('src/proxy.ts',{'./lib/auth-redirect':policy,'./auth':{auth:async()=>async()=>{called++;return new Response(null,{status:401});}}});
 for(const path of ['/offline.html','/ai-catalog.json','/.well-known/ai-catalog.json','/llms.txt','/robots.txt','/sitemap.xml','/sitemaps/static/sitemap.xml','/sitemaps/posts/0.xml','/sitemaps/posts/12.xml']) assert.equal((await proxy(new NextRequest('https://kwonnet.com'+path))).status,200);
 assert.equal(called,0);
 assert.equal((await proxy(new NextRequest('https://kwonnet.com/sitemaps/private'))).status,401);
 assert.equal((await proxy(new NextRequest('https://kwonnet.com/llms/private.txt'))).status,401);
});
