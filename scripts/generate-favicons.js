const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const publicDir = path.join(__dirname, '..', 'public');
  const inputLogo = path.join(publicDir, 'new_logo.png');

  if (!fs.existsSync(inputLogo)) {
    console.error('new_logo.png not found at', inputLogo);
    process.exit(1);
  }

  console.log('Generating favicons and assets from new_logo.png...');

  // 1. Overwrite public/logo.png and public/logo_transparent.png with the new logo
  fs.copyFileSync(inputLogo, path.join(publicDir, 'logo.png'));
  fs.copyFileSync(inputLogo, path.join(publicDir, 'logo_transparent.png'));
  console.log('Copied to logo.png and logo_transparent.png');

  // 2. Generate favicon-192.png (192x192, fitted inside square with slight padding)
  await sharp(inputLogo)
    .resize(192, 192, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .png()
    .toFile(path.join(publicDir, 'favicon-192.png'));
  console.log('Generated favicon-192.png');

  // 3. Generate apple-touch-icon.png (180x180, fitted with warm ivory/cream background or clean white)
  await sharp(inputLogo)
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 250, g: 249, b: 244, alpha: 1 }
    })
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // 4. Generate icon-64.png (64x64)
  await sharp(inputLogo)
    .resize(64, 64, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .png()
    .toFile(path.join(publicDir, 'icon-64.png'));
  console.log('Generated icon-64.png');

  // 5. Generate 32x32 & 16x16 PNGs and favicon.ico
  const icon32Buffer = await sharp(inputLogo)
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .png()
    .toBuffer();

  const icon16Buffer = await sharp(inputLogo)
    .resize(16, 16, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .png()
    .toBuffer();

  // Create a basic ICO header containing 32x32 PNG image
  // ICO header: 6 bytes (Reserved 0, Type 1 for ICO, Count 1)
  // Directory entry: 16 bytes (Width, Height, Colors, Reserved, Planes, BitCount, Size, Offset)
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // ICO type
  icoHeader.writeUInt16LE(1, 4); // 1 image

  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(32, 0); // Width 32
  dirEntry.writeUInt8(32, 1); // Height 32
  dirEntry.writeUInt8(0, 2);  // Palette colors (0 = no palette)
  dirEntry.writeUInt8(0, 3);  // Reserved
  dirEntry.writeUInt16LE(1, 4); // Color planes
  dirEntry.writeUInt16LE(32, 6); // Bits per pixel
  dirEntry.writeUInt32LE(icon32Buffer.length, 8); // Size of image data
  dirEntry.writeUInt32LE(6 + 16, 12); // Offset to image data

  const icoFile = Buffer.concat([icoHeader, dirEntry, icon32Buffer]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoFile);
  console.log('Generated favicon.ico');

  // 6. Generate logo_og.png (500x333) for OpenGraph
  const ogBuffer = await sharp(inputLogo)
    .resize(500, 333, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .png()
    .toFile(path.join(publicDir, 'logo_og.png'));
  console.log('Generated logo_og.png');

  // 7. Generate base64 data url for src/lib/logo-base64.ts
  const ogFileBuffer = fs.readFileSync(path.join(publicDir, 'logo_og.png'));
  const base64Str = `data:image/png;base64,${ogFileBuffer.toString('base64')}`;

  const tsContent = `// Automatically generated from public/new_logo.png
export const LOGO_OG_BASE64 = "${base64Str}";
`;
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'lib', 'logo-base64.ts'), tsContent);
  console.log('Updated src/lib/logo-base64.ts');

  console.log('All branding assets generated successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
