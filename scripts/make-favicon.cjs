const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function main() {
  const size = 192;
  const padding = 18;
  const innerSize = size - padding * 2; // 156

  // Create a clean white circle background
  const circleSvg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#ffffff" />
  </svg>`;

  const circleBg = Buffer.from(circleSvg);

  // Resize and center the logo inside the white circle
  const emblem = await sharp('public/favicon-192.png')
    .trim()
    .resize(innerSize, innerSize, { fit: 'inside' })
    .toBuffer();

  const final192 = await sharp(circleBg)
    .composite([{ input: emblem, gravity: 'center' }])
    .png()
    .toBuffer();

  // Save 192x192
  fs.writeFileSync('public/favicon-192.png', final192);
  fs.writeFileSync('src/app/icon.png', final192);

  // Save 64x64
  const final64 = await sharp(final192).resize(64, 64).png().toBuffer();
  fs.writeFileSync('public/icon-64.png', final64);

  // Save 32x32 favicon.ico
  const final32 = await sharp(final192).resize(32, 32).png().toBuffer();
  fs.writeFileSync('public/favicon.ico', final32);
  fs.writeFileSync('src/app/favicon.ico', final32);

  // Save 180x180 apple touch icon
  const final180 = await sharp(final192).resize(180, 180).png().toBuffer();
  fs.writeFileSync('public/apple-touch-icon.png', final180);

  console.log('Favicon assets generated successfully with white circular background!');
}

main().catch(console.error);
