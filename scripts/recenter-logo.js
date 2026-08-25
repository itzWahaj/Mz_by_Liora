const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function recenter() {
  const publicDir = path.join(__dirname, '..', 'public');
  const inputLogo = path.join(publicDir, 'new_logo.png');

  // 1. Trim surrounding empty/white pixels to find exact artwork bounds
  const trimmed = await sharp(inputLogo)
    .trim({ background: '#ffffff', threshold: 10 })
    .toBuffer({ resolveWithObject: true });

  const { width, height } = trimmed.info;
  console.log(`Trimmed logo artwork dimensions: ${width}x${height}`);

  // 2. Determine square canvas dimension with balanced padding
  const maxDim = Math.max(width, height);
  const padding = Math.round(maxDim * 0.08); // 8% padding
  const squareSize = maxDim + padding * 2;

  // 3. Composite trimmed artwork right in the exact geometric & optical center
  const left = Math.round((squareSize - width) / 2);
  const top = Math.round((squareSize - height) / 2);

  const centeredLogoBuffer = await sharp({
    create: {
      width: squareSize,
      height: squareSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 } // transparent background
    }
  })
  .composite([
    {
      input: trimmed.data,
      left,
      top
    }
  ])
  .png()
  .toBuffer();

  // Save the perfectly centered square logo to new_logo.png, logo.png, logo_transparent.png
  fs.writeFileSync(path.join(publicDir, 'new_logo.png'), centeredLogoBuffer);
  fs.writeFileSync(path.join(publicDir, 'logo.png'), centeredLogoBuffer);
  fs.writeFileSync(path.join(publicDir, 'logo_transparent.png'), centeredLogoBuffer);
  console.log('Saved centered new_logo.png, logo.png, logo_transparent.png');

  // 4. Regenerate favicons and icons from the centered logo
  // 192x192
  await sharp(centeredLogoBuffer)
    .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'favicon-192.png'));

  // 180x180 apple touch icon
  await sharp(centeredLogoBuffer)
    .resize(180, 180, { fit: 'contain', background: { r: 250, g: 249, b: 244, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 64x64
  await sharp(centeredLogoBuffer)
    .resize(64, 64, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'icon-64.png'));

  // 32x32 for favicon.ico
  const icon32Buffer = await sharp(centeredLogoBuffer)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0);
  icoHeader.writeUInt16LE(1, 2);
  icoHeader.writeUInt16LE(1, 4);

  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(32, 0);
  dirEntry.writeUInt8(32, 1);
  dirEntry.writeUInt8(0, 2);
  dirEntry.writeUInt8(0, 3);
  dirEntry.writeUInt16LE(1, 4);
  dirEntry.writeUInt16LE(32, 6);
  dirEntry.writeUInt32LE(icon32Buffer.length, 8);
  dirEntry.writeUInt32LE(6 + 16, 12);

  const icoFile = Buffer.concat([icoHeader, dirEntry, icon32Buffer]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoFile);

  // 5. Generate logo_og.png & update src/lib/logo-base64.ts
  await sharp(centeredLogoBuffer)
    .resize(500, 500, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'logo_og.png'));

  const ogFileBuffer = fs.readFileSync(path.join(publicDir, 'logo_og.png'));
  const base64Str = `data:image/png;base64,${ogFileBuffer.toString('base64')}`;
  const tsContent = `// Automatically generated from public/new_logo.png
export const LOGO_OG_BASE64 = "${base64Str}";
`;
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'lib', 'logo-base64.ts'), tsContent);

  console.log('All centered assets generated successfully!');
}

recenter().catch(err => {
  console.error(err);
  process.exit(1);
});
