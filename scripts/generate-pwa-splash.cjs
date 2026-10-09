const fs = require('node:fs/promises'), path = require('node:path'), ts = require('typescript'), sharp = require('sharp');
// Reproducible launch assets composed from existing Kwonnet brand artwork.
(async () => {
  const root = path.resolve(__dirname, '..'), source = await fs.readFile(path.join(root, 'src/config/pwa-splash.ts'), 'utf8');
  const config = {exports: {}};
  new Function('module', 'exports', ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText)(config, config.exports);
  const {pwaSplashScreens, pwaSplashColors} = config.exports;
  const directory = path.join(root, 'public/splash'); await fs.mkdir(directory, {recursive: true});
  for (const screen of pwaSplashScreens) for (const orientation of ['portrait', 'landscape']) {
    const width = (orientation === 'portrait' ? screen.width : screen.height) * screen.scale;
    const height = (orientation === 'portrait' ? screen.height : screen.width) * screen.scale;
    const size = Math.min(320, Math.round(Math.min(width, height) * 0.22));
    for (const mode of ['light', 'dark']) {
      const logo = await sharp(path.join(root, `public/logo-${mode === 'dark' ? 'white' : 'grey'}-320x320.png`)).resize(size, size, {fit: 'contain'}).toBuffer();
      await sharp({create: {width, height, channels: 3, background: pwaSplashColors[mode]}})
        .composite([{input: logo, gravity: 'centre'}]).png({compressionLevel: 9})
        .toFile(path.join(directory, `${screen.width}x${screen.height}-${screen.scale}-${orientation}-${mode}.png`));
    }
  }
  console.log(`Generated ${pwaSplashScreens.length * 4} startup images.`);
})().catch(error => {console.error(error);process.exitCode = 1;});
