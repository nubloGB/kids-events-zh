import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const dir = "public/images";
const files = (await readdir(dir)).filter((file) => file.endsWith(".jpg"));
for (const file of files) {
  const input = path.join(dir, file);
  const stem = file.replace(/\.jpg$/, "");
  for (const width of [640, 1280]) {
    await sharp(input)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 72 })
      .toFile(path.join(dir, `${stem}-${width}.webp`));
  }
}
console.log(`wrote webp for ${files.length} jpg files`);
