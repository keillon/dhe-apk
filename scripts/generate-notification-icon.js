const fs = require("fs");
const path = require("path");
const PNG = require("pngjs").PNG;

/**
 * Gera ícone de notificação Android: branco opaco em fundo 100% transparente.
 * Densidades: mdpi..xxxhdpi
 */
function loadPng(file) {
  return PNG.sync.read(fs.readFileSync(file));
}

function savePng(file, png) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, PNG.sync.write(png));
}

function makeSilhouette(srcPath, size, paddingRatio = 0.1, lumMin = 160) {
  const src = loadPng(srcPath);
  let minX = src.width;
  let minY = src.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const i = (src.width * y + x) << 2;
      if (src.data[i + 3] < 16) continue;
      const lum = 0.299 * src.data[i] + 0.587 * src.data[i + 1] + 0.114 * src.data[i + 2];
      if (lum < lumMin) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < 0) throw new Error(`Sem pixels claros em ${srcPath}`);

  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const inner = size * (1 - paddingRatio * 2);
  const scale = Math.min(inner / bw, inner / bh);
  const dw = bw * scale;
  const dh = bh * scale;
  const ox = (size - dw) / 2;
  const oy = (size - dh) / 2;

  const out = new PNG({ width: size, height: size, colorType: 6 });
  out.data.fill(0);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sx = Math.floor((x - ox) / scale) + minX;
      const sy = Math.floor((y - oy) / scale) + minY;
      if (sx < minX || sy < minY || sx > maxX || sy > maxY) continue;
      const si = (src.width * sy + sx) << 2;
      if (src.data[si + 3] < 16) continue;
      const lum = 0.299 * src.data[si] + 0.587 * src.data[si + 1] + 0.114 * src.data[si + 2];
      if (lum < lumMin) continue;
      const oi = (size * y + x) << 2;
      out.data[oi] = 255;
      out.data[oi + 1] = 255;
      out.data[oi + 2] = 255;
      out.data[oi + 3] = 255;
    }
  }

  return out;
}

function countWhite(png) {
  let n = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    if (png.data[i + 3] > 200) n++;
  }
  return n;
}

const root = path.resolve(__dirname, "..");
const source = path.join(root, "assets", "monochrome-icon.png");
const densities = [
  { folder: "drawable-mdpi", size: 24 },
  { folder: "drawable-hdpi", size: 36 },
  { folder: "drawable-xhdpi", size: 48 },
  { folder: "drawable-xxhdpi", size: 72 },
  { folder: "drawable-xxxhdpi", size: 96 },
  { folder: "drawable", size: 96 },
];

const outDir = path.join(root, "assets", "notification-icons");
fs.mkdirSync(outDir, { recursive: true });

for (const density of densities) {
  const png = makeSilhouette(source, density.size, 0.08, 140);
  const dest = path.join(outDir, density.folder, "notification_icon.png");
  savePng(dest, png);
  console.log(density.folder, density.size, "white", countWhite(png));
}

// Asset principal usado pelo plugin expo-notifications
const main = makeSilhouette(source, 96, 0.08, 140);
savePng(path.join(root, "assets", "notification-icon.png"), main);
console.log("assets/notification-icon.png white", countWhite(main));
