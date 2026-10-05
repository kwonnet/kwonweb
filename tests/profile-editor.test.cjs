const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { JSDOM } = require('jsdom');
function load(path, dependencies) {
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', code)(id => id in dependencies ? dependencies[id] : require(id), module, module.exports);
  return module.exports;
}
test('profile form locks restricted fields, uploads cropped images and preserves edits after failure', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://kwonnet.test' });
  const previous = { window: global.window, document: global.document, act: global.IS_REACT_ACT_ENVIRONMENT };
  global.window = dom.window; global.document = dom.window.document; global.IS_REACT_ACT_ENVIRONMENT = true;
  const { createRoot } = require('react-dom/client');
  const controls = {}, submitted = [], uploads = [], updates = [];
  let cropProps, rejectImage = true;
  function Container({ children, component, onSubmit }) { return React.createElement(component === 'form' ? 'form' : 'div', { onSubmit }, children); }
  const mui = Object.fromEntries(['Alert', 'Avatar', 'Box', 'Paper', 'Stack', 'Tooltip', 'Typography'].map(name => [name, Container]));
  mui.TextField = props => { controls[props.label] = props; return React.createElement('input', { 'aria-label': props.label, value: props.value || '', disabled: props.disabled, readOnly: true }); };
  mui.Autocomplete = props => { controls.Country = props; return React.createElement('select', { 'aria-label': 'Country', disabled: props.disabled }); };
  mui.Button = ({ children, onClick, type, disabled, loading }) => React.createElement('button', { onClick, type: type || 'button', disabled: disabled || loading }, children);
  mui.IconButton = ({ children, onClick, disabled, ...props }) => React.createElement('button', { type: 'button', onClick, disabled, 'aria-label': props['aria-label'] }, children);
  const Editor = load('src/components/profile/ProfileEditor.tsx', {
    '@mui/material': mui, '@mui/icons-material/CameraAlt': { default: () => null, __esModule: true },
    'next-auth/react': { useSession: () => ({ update: async data => { updates.push(data); return { user: { id: 'u' } }; } }) },
    'next/navigation': { useRouter: () => ({ refresh() {} }) },
    'swr': { useSWRConfig: () => ({ mutate: async () => {} }) },
    '@/utils/profile-cache': { updateProfileCache: value => value },
    'next/link': { default: Container, __esModule: true },
    'next/dynamic': { default: () => props => { cropProps = props; return React.createElement('div', null, 'Crop image'); }, __esModule: true },
    '@/components/common/PageHeader': { default: Container, __esModule: true },
    '@/lib/profile-actions': { saveProfile: async changes => { submitted.push(changes); if (rejectImage) { rejectImage = false; return { error: 'Image save failed' }; } return changes.bio !== undefined ? { error: 'Try again' } : { profile: { ...initial.profile, ...changes } }; } },
    '@/utils/r2-upload': { uploadMultipleFilesWithMetadata: async files => { uploads.push(files); return [{ url: 'https://media.kwonnet.test/avatar.webp' }]; } },
  }).default;
  const initial = { countries: [{ id: 'NG', name: 'Nigeria' }], profile: { id: 'u', name: 'Ada', username: 'ada', bio: '', phone: null, website: null, avatar: null, banner: null, countryId: 'NG', dateOfBirth: '1990-01-01', countryNextChangeAt: '2099-01-01', dateOfBirthNextChangeAt: '2099-01-01' } };
  const root = createRoot(document.getElementById('root'));
  const originalCreate = URL.createObjectURL, originalRevoke = URL.revokeObjectURL;
  URL.createObjectURL = () => 'blob:crop'; URL.revokeObjectURL = () => {};
  try {
    await React.act(async () => root.render(React.createElement(Editor, { initial })));
    assert.equal(controls.Country.disabled, true); assert.equal(controls['Date of birth'].disabled, true);
    assert.equal(controls.Bio.slotProps.htmlInput.maxLength, 160);
    assert.equal(controls.Email, undefined); assert.equal(controls.Password, undefined);
    await React.act(async () => controls.Bio.onChange({ target: { value: 'New bio' } }));
    const file = new dom.window.File(['image'], 'avatar.png', { type: 'image/png' });
    const input = document.querySelector('input[type=file]'); Object.defineProperty(input, 'files', { value: [file] });
    await React.act(async () => input.dispatchEvent(new dom.window.Event('change', { bubbles: true })));
    assert.equal(cropProps.kind, 'avatar'); assert.equal(cropProps.source, 'blob:crop');
    await React.act(async () => { await assert.rejects(cropProps.onSave(file), /Image save failed/); });
    assert.equal(controls.Bio.value, 'New bio');
    assert.equal(controls.Bio.disabled, false);
    await React.act(async () => cropProps.onSave(file));
    assert.equal(uploads.length, 2);
    assert.equal(uploads[0][0].folder, "profiles");
    const bannerInput = document.querySelectorAll('input[type=file]')[1];
    Object.defineProperty(bannerInput, 'files', { value: [file] });
    await React.act(async () => bannerInput.dispatchEvent(new dom.window.Event('change', { bubbles: true })));
    assert.equal(cropProps.kind, 'banner');
    await React.act(async () => cropProps.onSave(file));
    assert.equal(uploads[2][0].folder, "banners");
    await React.act(async () => document.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })));
    assert.deepEqual(updates[0], { refreshIdentity: true });
    assert.deepEqual(submitted[0], { avatar: 'https://media.kwonnet.test/avatar.webp' });
    assert.deepEqual(submitted[2], { banner: 'https://media.kwonnet.test/avatar.webp' });
    assert.deepEqual(submitted[3], { bio: 'New bio' });
    assert.equal(controls.Bio.value, 'New bio'); assert.equal(controls.Bio.disabled, false); assert.match(document.body.textContent, /Try again/);
  } finally {
    await React.act(async () => root.unmount()); dom.window.close();
    URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke;
    global.window = previous.window; global.document = previous.document; global.IS_REACT_ACT_ENVIRONMENT = previous.act;
  }
});
test('saving profiles uses authenticated server credentials and invalidates old and new profile caches', async () => {
  const prior = global.fetch, tags = [], paths = [];
  const { saveProfile } = load('src/lib/profile-actions.ts', {
    '@/auth': { auth: async () => ({ user: { username: 'old', accessToken: 'server-token' } }) },
    '@/config': { apiUrl: 'https://api.kwonnet.test/api/v1' },
    'next/cache': { updateTag: tag => tags.push(tag), revalidatePath: path => paths.push(path) },
  });
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://api.kwonnet.test/api/v1/users/me/profile'); assert.equal(options.headers.Authorization, 'Bearer server-token'); assert.equal(options.cache, 'no-store');
    return new Response(JSON.stringify({ username: 'new' }));
  };
  try {
    const result = await saveProfile({ username: 'new' });
    assert.equal(result.profile.username, 'new'); assert.deepEqual(paths, ['/@old', '/@new']);
    assert.ok(tags.includes('user-@old')); assert.ok(tags.includes('user-new'));
    global.fetch = async () => new Response(JSON.stringify({ error: 'Country cooldown' }), { status: 409 });
    assert.equal((await saveProfile({ countryId: 'GB' })).error, 'Country cooldown');
  } finally { global.fetch = prior; }
});
