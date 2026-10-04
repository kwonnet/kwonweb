const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { JSDOM } = require('jsdom');
const { createRoot } = require('react-dom/client');

function load(path, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020,
  } }).outputText;
  new Function('require', 'module', 'exports', code)(name => {
    if (name.endsWith('.css')) return {};
    if (name in mocks) return mocks[name];
    if (name.startsWith('@mui/icons-material/')) return () => null;
    return require(name);
  }, module, module.exports);
  return module.exports;
}

test('feed updates and video readiness renders retain observers, position and manual pause', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost', pretendToBeVisual: true });
  global.window = dom.window; global.document = dom.window.document;
  global.localStorage = dom.window.localStorage; global.IS_REACT_ACT_ENVIRONMENT = true;
  let setReady, playerProps, renders = 0, subscriptions = 0, plays = 0;
  const nodes = [], watchNodes = [];
  const player = { currentTime: 0, play: async () => { plays++; }, pause() {}, subscribe() { subscriptions++; return () => {}; } };
  const empty = () => null;
  const element = ({ children }) => React.createElement('div', null, children);
  const VideoPlayer = load('src/components/common/VideoPlayer.tsx', {
    '@vidstack/react/player/layouts/plyr': { PlyrLayout: empty, plyrLayoutIcons: {} },
    '@vidstack/react/icons': { ChromecastIcon: empty },
    '@vidstack/react': {
      useMediaState: name => { assert.equal(name, 'canPlay'); const [ready, setter] = React.useState(false); setReady = setter; return ready; },
      MediaPlayer: React.forwardRef((props, ref) => { renders++; playerProps = props; React.useImperativeHandle(ref, () => player, []); return React.createElement('div', null, props.children); }),
      MediaProvider: element, Poster: empty, GoogleCastButton: empty,
      Tooltip: { Root: element, Trigger: element, Content: element },
    },
    '@mui/material': Object.fromEntries(['Alert', 'IconButton', 'List', 'ListItem', 'ListItemButton', 'ListItemIcon', 'ListItemText', 'Popover'].map(name => [name, empty])),
    '@/utils': { genVideoUrlInfo: (id, poster, url) => ({ hlsUrl: url, poster }), getPostUrl: () => '', getSessionId: () => 'session', shouldSendLog: () => true },
    '@/providers/NotificationsProvider': { useNotifications: () => ({ show() {} }) },
    'react-intersection-observer': { useInView: () => ({ inView: true, ref: React.useCallback(node => nodes.push(node), []) }) },
    '@/hooks': { useAuthSession: () => ({}), useTrackVideoWatchTime: () => React.useCallback(node => watchNodes.push(node), []) },
    '@/types/post': { PostMediaAction: {}, PostMediaKind: {} },
    '@/lib/posts': { sendPostLog: () => { throw Error('Guest analytics must not be sent'); } },
    '@/utils/video-playback-controller': load('src/utils/video-playback-controller.ts'),
  }).default;
  const props = { post: { id: 'p', userId: 'author', author: { username: 'ada' } }, item: { id: 'm', fileId: 'video-1', url: 'video.mp4', altText: 'Video' }, autoPlay: true };
  const root = createRoot(document.getElementById('root'));
  try {
    await React.act(async () => root.render(React.createElement(VideoPlayer, props)));
    await React.act(async () => setReady(true));
    assert.equal(plays, 1);
    player.currentTime = 15;
    const previousRenders = renders;
    await React.act(async () => root.render(React.createElement(VideoPlayer, { ...props, post: { ...props.post, totalLikes: 4 }, item: { ...props.item } })));
    assert.equal(renders, previousRenders, 'reaction updates must not render the player');
    playerProps.onMediaPauseRequest();
    await React.act(async () => setReady(false));
    await React.act(async () => setReady(true));
    assert.equal(plays, 1, 'readiness must not undo a manual pause');
    assert.equal(player.currentTime, 15);
    assert.equal(subscriptions, 1);
    assert.equal(nodes.length, 1, 'rerenders must not detach the visibility observer');
    assert.equal(watchNodes.length, 1);
    // A real source change must still update the media player.
    await React.act(async () => root.render(React.createElement(VideoPlayer, { ...props, item: { ...props.item, url: 'replacement.mp4' } })));
    assert.equal(playerProps.src, 'replacement.mp4');
  } finally { await React.act(async () => root.unmount()); dom.window.close(); }
});
