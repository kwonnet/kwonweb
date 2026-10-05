const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve, dirname } = require('node:path');
const ts = require('typescript');
const { JSDOM } = require('jsdom');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { createRoot } = require('react-dom/client');
const { EditorState, ContentState } = require('draft-js');

const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
global.window = dom.window;
global.document = dom.window.document;
global.IS_REACT_ACT_ENVIRONMENT = true;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const empty = () => null;
const element = ({ children }) => React.createElement('div', null, children);

// Load the actual TSX modules without a Next server. Only framework UI and network
// dependencies are replaced; parsing, Draft state, plugin logic, and React are real.
function loader(overrides = {}) {
  const cache = new Map();
  const mocks = {
    '@mui/material': { Box: element, Typography: element, Avatar: element, Stack: element, IconButton: element, Popover: empty },
    '@/utils': { formatNumber: String },
    '@mui/icons-material/EmojiEmotionsOutlined': empty,
    'next/link': ({ prefetch, ...props }) => React.createElement('a', props),
    ...overrides,
  };
  function load(file) {
    file = resolve(file);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const code = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const localRequire = name => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.endsWith('.css')) return {};
      if (name === '@/utils/post-text') return load('src/utils/post-text.ts');
      if (name.startsWith('./')) return load(resolve(dirname(file), name + '.tsx'));
      return require(name);
    };
    new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
    return module.exports;
  }
  return load;
}
const stateWithText = text => EditorState.moveFocusToEnd(EditorState.createWithContent(ContentState.createFromText(text)));

test('post text is present in server HTML, safely linked, without loading an editor', () => {
  const rejectEditor = () => { throw new Error('Reading a post initialized Draft.js'); };
  const PostText = loader({ 'draft-js': new Proxy({}, { get: rejectEditor }), '@draft-js-plugins/editor': rejectEditor })('src/components/post/PostText.tsx').default;
  const html = renderToStaticMarkup(React.createElement(PostText, { content: 'Hi @Bob.Smith #hello\n<script>x</script>' }));
  assert.match(html, /href="\/@Bob.Smith"/);
  assert.match(html, /href="\/search\?q=%23hello&amp;src=hashtag_click&amp;vertical=trends&amp;tab=top"/);
  assert.match(html, /&lt;script&gt;x&lt;\/script&gt;/);
  assert.doesNotMatch(html, /contenteditable|DraftEditor|Loading/);
});

test('composer initializes once; caret moves do not update posts; clearing text removes metadata', async () => {
  let editorProps;
  let initializations = 0;
  const realDraft = require('draft-js');
  const draft = { ...realDraft, EditorState: new Proxy(EditorState, { get(target, key) {
    if (key === 'createWithContent') return (...args) => { initializations++; return target.createWithContent(...args); };
    return target[key];
  } }) };
  const ContentEditor = loader({
    'draft-js': draft,
    '@draft-js-plugins/editor': props => { editorProps = props; return null; },
    './linkify': () => ({}),
    './mention': () => ({ mentionPlugin: {}, MentionSuggestions: empty }),
    './hashtag': () => ({ hashtagPlugin: {}, HashtagSuggestions: empty }),
    '@/hooks': { useAuthSession: () => ({ token: 'test' }) },
    '@/lib/users': { searchUsers: async () => [] },
  })('src/components/post/EditableContentEditor.tsx').default;
  const updates = [];
  const root = createRoot(document.getElementById('root'));
  try {
    await React.act(async () => root.render(React.createElement(ContentEditor, { content: 'First\nSecond', onContentChange: value => updates.push(value) })));
    assert.equal(editorProps.editorState.getCurrentContent().getBlockMap().size, 2);
    const initial = editorProps.editorState;
    await React.act(async () => editorProps.onChange(EditorState.forceSelection(initial, initial.getSelection().merge({ anchorOffset: 2, focusOffset: 2 }))));
    assert.equal(updates.length, 0);
    await React.act(async () => editorProps.onChange(stateWithText('@Bob.Smith #naïve')));
    assert.deepEqual(updates[0], { content: '@Bob.Smith #naïve', mentions: ['Bob.Smith'], tags: ['naïve'] });
    await React.act(async () => editorProps.onChange(stateWithText('')));
    assert.deepEqual(updates[1], { content: '', mentions: [], tags: [] });
    assert.equal(initializations, 1);
  } finally { await React.act(async () => root.unmount()); }
});

for (const [kind, name, field, callback, text] of [
  ['mention', 'mentionPlugin', 'mentionList', 'onMentionsChange', '@Bob.Smith'],
  ['hashtag', 'hashtagPlugin', 'hashtagList', 'onTagsChange', '#naïve'],
]) {
  test(`${kind} decoration and metadata agree with post text, including deletions`, () => {
    const changes = [];
    const factory = loader()(`src/components/post/${kind}.tsx`).default;
    const plugin = factory({ [field]: [], [callback]: values => changes.push(values) })[name];
    const state = stateWithText(text);
    const ranges = [];
    plugin.decorators[0].strategy(state.getCurrentContent().getFirstBlock(), (start, end) => ranges.push([start, end]));
    assert.deepEqual(ranges, [[0, text.length]]);
    plugin.onChange(state);
    plugin.onChange(stateWithText(''));
    assert.deepEqual(changes, [[text.slice(1)], []]);
    plugin.willUnmount();
  });
}

test('async mention suggestions appear without another keystroke and stale searches cannot reopen them', async () => {
  let resolveSearch;
  let requests = 0;
  const result = [{ id: 'alice', username: 'alice', name: 'Alice', avatar: '', link: '/@alice' }];
  const factory = loader()('src/components/post/mention.tsx').default;
  const { mentionPlugin, MentionSuggestions } = factory({ mentionList: [], fetchSuggestions: () => {
    requests++;
    return new Promise(resolve => { resolveSearch = resolve; });
  } });
  // jsdom has no layout engine; supply just the caret geometry used by the portal.
  const getSelection = window.getSelection;
  window.getSelection = () => ({ rangeCount: 1, getRangeAt: () => ({ getBoundingClientRect: () => ({ top: 1, left: 1, bottom: 10, width: 1, height: 1 }) }) });
  const root = createRoot(document.getElementById('root'));
  try {
    await React.act(async () => root.render(React.createElement(MentionSuggestions)));
    await React.act(async () => { mentionPlugin.onChange(stateWithText('@alice')); await delay(330); });
    assert.equal(requests, 1);
    await React.act(async () => resolveSearch(result));
    assert.match(document.body.textContent, /Alice/);
    // A query with no local match starts another request. Clear it before the reply.
    await React.act(async () => { mentionPlugin.onChange(stateWithText('@zzzzz')); await delay(330); });
    await React.act(async () => { mentionPlugin.onChange(stateWithText('')); root.render(React.createElement(MentionSuggestions)); });
    await React.act(async () => resolveSearch(result));
    assert.equal(document.getElementById('mention-portal'), null);
    // Unmount cancels a queued request entirely.
    mentionPlugin.onChange(stateWithText('@bob'));
    mentionPlugin.willUnmount();
    await delay(330);
    assert.equal(requests, 2);
  } finally {
    mentionPlugin.willUnmount();
    window.getSelection = getSelection;
    await React.act(async () => root.unmount());
  }
});

test('composer links use the safe post tokenizer and exclude executable schemes', () => {
  const { linkStrategy } = loader()('src/components/post/linkify.tsx');
  const text = 'Hi @alice #news https://example.com/path?x=1 javascript:alert(1)';
  const ranges = [];
  linkStrategy(ContentState.createFromText(text).getFirstBlock(), (start, end) => ranges.push(text.slice(start, end)));
  assert.deepEqual(ranges, ['https://example.com/path?x=1']);
});

test('emoji replaces the selection and preserves post metadata without restoring stale Draft text', async () => {
  let editorProps, emojiProps;
  const FakeEditor = React.forwardRef((props, ref) => {
    editorProps = props;
    React.useImperativeHandle(ref, () => ({ focus: () => props.onChange(props.editorState) }));
    return null;
  });
  const ContentEditor = loader({
    '@mui/material': { Box: element, Typography: element, Popover: element,
      IconButton: props => React.createElement('button', { onClick: props.onClick }, 'emoji') },
    'next/dynamic': () => props => { emojiProps = props; return null; },
    '@draft-js-plugins/editor': FakeEditor,
    './mention': () => ({ mentionPlugin: {}, MentionSuggestions: empty }),
    './hashtag': () => ({ hashtagPlugin: {}, HashtagSuggestions: empty }),
    '@/hooks': { useAuthSession: () => ({ token: 'test' }) },
    '@/lib/users': { searchUsers: async () => [] },
  })('src/components/post/EditableContentEditor.tsx').default;
  const updates = [];
  const root = createRoot(document.getElementById('root'));
  try {
    await React.act(async () => root.render(React.createElement(ContentEditor, { content: 'Hello @alice #news', onContentChange: value => updates.push(value) })));
    const initial = editorProps.editorState;
    await React.act(async () => editorProps.onChange(EditorState.forceSelection(initial, initial.getSelection().merge({ anchorOffset: 0, focusOffset: 5 }))));
    await React.act(async () => document.querySelector('button').click());
    await React.act(async () => emojiProps.onEmojiClick({ emoji: '😊' }));
    assert.equal(editorProps.editorState.getCurrentContent().getPlainText(), '😊 @alice #news');
    assert.deepEqual(updates, [{ content: '😊 @alice #news', mentions: ['alice'], tags: ['news'] }]);
  } finally { await React.act(async () => root.unmount()); }
});
