const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
function load(file, mocks) {
  const module = {exports: {}};
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true}}).outputText;
  new Function('require', 'module', 'exports', code)(name => name in mocks ? mocks[name] : require(name), module, module.exports);
  return module.exports;
}
test('engagement tabs expose Gifters only to the post owner and use the existing post route', () => {
  const element = ({children}) => React.createElement('div', null, children);
  const Navigation = load('src/app/(dashboard)/[username]/feed/[id]/(actions)/TopTabNavigation.tsx', {
    '@mui/material/Box': {__esModule: true, default: element},
    '@mui/material/Tabs': {__esModule: true, default: element, tabsClasses: {scrollButtons: 'buttons', list: 'list'}},
    '@mui/material/Tab': {__esModule: true, default: props => React.createElement('a', {href: props.href}, props.label)},
    'next/link': {__esModule: true, default: element},
    'next/navigation': {usePathname: () => '/@ada/feed/post/gifters'},
    'react-sticky-box': {__esModule: true, default: element},
  }).default;
  const visitor = renderToStaticMarkup(React.createElement(Navigation, {isOwner: false}));
  assert.match(visitor, /Quotes/); assert.match(visitor, /Reposts/); assert.doesNotMatch(visitor, /Gifters/);
  assert.match(renderToStaticMarkup(React.createElement(Navigation, {isOwner: true})), /href="\/@ada\/feed\/post\/gifters"/);
});
