import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import generateBmFont from "msdf-bmfont-xml";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "public", "icons");
const layerSize = 256;

const icons = [
  { name: "home", codepoint: 0xe88a },
  { name: "favorite", codepoint: 0xe87d },
  { name: "star", codepoint: 0xe838 },
  { name: "face", codepoint: 0xe87c },
  { name: "pets", codepoint: 0xe91d },
] as const;

type FontChar = { id: number; x: number; y: number; width: number; height: number };
type FontData = { chars: FontChar[] };

function generate(fontPath: string): Promise<{ texture: Buffer; font: FontData }> {
  return new Promise((resolve, reject) => {
    generateBmFont(
      fontPath,
      {
        outputType: "json",
        filename: path.join(output, "material-icons-msdf"),
        charset: icons.map(({ codepoint }) => String.fromCodePoint(codepoint)),
        fontSize: 180,
        textureSize: [512, 512],
        distanceRange: 12,
        fieldType: "msdf",
        smartSize: true,
        pot: true,
        rot: false,
      },
      (error: Error | null, textures: Array<{ texture: Buffer }>, fontFile: { data: string }) => {
        if (error) reject(error);
        else resolve({ texture: textures[0].texture, font: JSON.parse(fontFile.data) as FontData });
      },
      { log() {}, warn() {}, error(message: unknown) { console.error(message); } },
    );
  });
}

await mkdir(path.join(output, "layers"), { recursive: true });
const fontPath = path.join(root, "assets", "MaterialIcons-Regular.ttf");
const { texture, font } = await generate(fontPath);

for (const icon of icons) {
  const glyph = font.chars.find((candidate) => candidate.id === icon.codepoint);
  if (!glyph) throw new Error(`Material Icon '${icon.name}' (${icon.codepoint.toString(16)}) fehlt im Font.`);

  // Extract the glyph before compositing; its MSDF pixels remain unscaled.
  const cell = await sharp(texture).extract({ left: glyph.x, top: glyph.y, width: glyph.width, height: glyph.height }).png().toBuffer();
  const centered = await sharp({
    create: { width: layerSize, height: layerSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } },
  }).composite([{ input: cell, left: Math.round((layerSize - glyph.width) / 2), top: Math.round((layerSize - glyph.height) / 2) }]).png().toBuffer();
  await writeFile(path.join(output, "layers", `${icon.name}.png`), centered);
}

console.log(`Generated ${icons.length} MSDF layers in public/icons/layers/.`);
