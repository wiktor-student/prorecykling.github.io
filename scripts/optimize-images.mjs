// Generuje wersje WebP wszystkich rastrowych obrazów użytych w plikach HTML.
// Użycie: npm run images   (oryginały w img/ zostają nietknięte)
import sharp from 'sharp';
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { basename, extname } from 'node:path';

const MAX_WIDTH = 800; // zdjęcia w kartach
const WIDE = { 'IMG_9979.JPEG': 1400 }; // zdjęcie hero (pełna szerokość)
const ICON_WIDTH = 200; // małe ikony (źródło ≤ 512 px)
const RASTER = /\.(jpe?g|png)$/i;

/** Usuwa białe tło: alfa = „odległość od bieli”, kolor odzyskany z równania c = 255·(1−α) + c'·α. */
async function whiteToTransparent(pipeline) {
    const { data, info } = await pipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
        const alpha = 255 - Math.min(data[i], data[i + 1], data[i + 2]);
        if (alpha === 0) {
            data[i] = data[i + 1] = data[i + 2] = 0;
        } else {
            for (let c = 0; c < 3; c++) {
                data[i + c] = Math.max(
                    0,
                    Math.min(255, Math.round((data[i + c] - 255 * (1 - alpha / 255)) / (alpha / 255)))
                );
            }
        }
        data[i + 3] = alpha;
    }
    return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
        .png()
        .toBuffer();
}

const htmlFiles = readdirSync('.').filter((f) => f.endsWith('.html'));
const refs = new Set();
for (const file of htmlFiles) {
    for (const m of readFileSync(file, 'utf8').matchAll(/img\/([^"'\s)]+\.(?:jpe?g|png))/gi)) {
        refs.add(m[1]);
    }
}

const sizes = {};
for (const name of [...refs].sort()) {
    const src = `img/${name}`;
    if (!existsSync(src) || !RASTER.test(src)) continue;

    const meta = await sharp(src).metadata();
    const isIcon = Math.max(meta.width, meta.height) <= 512;
    const stem = basename(name, extname(name));
    const dest = `img/${stem}.webp`;

    let pipeline = sharp(src)
        .rotate() // uwzględnij orientację EXIF
        .resize({ width: isIcon ? ICON_WIDTH : (WIDE[name] ?? MAX_WIDTH), withoutEnlargement: true });

    // Logo ma białe tło – zamieniamy je na przezroczystość, żeby pasowało do każdego tła.
    if (name === 'logo.png') pipeline = sharp(await whiteToTransparent(pipeline));

    const info = await pipeline.webp({ quality: 85, alphaQuality: 100, effort: 6 }).toFile(dest);

    sizes[name] = { webp: `${stem}.webp`, width: info.width, height: info.height };
    console.log(`${dest.padEnd(34)} ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} kB`);
}

writeFileSync('scripts/image-sizes.json', JSON.stringify(sizes, null, 2) + '\n');
