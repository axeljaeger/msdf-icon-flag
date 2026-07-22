# MSDF Icon Texture Array Flag

A compact [Babylon Lite](https://www.babylonjs.com/lite/) / WebGPU demonstration
of `texture_2d_array` sampling. Five Google Material Icons are converted to an
MSDF asset, uploaded as equally sized texture-array layers, and displayed on a
wind-animated heraldic flag.

The live inspector shows the actual array layers, the currently selected layer,
and how UV repeat turns one selected icon into a 2×2 grid on the flag.

## What it demonstrates

- A `texture_2d_array<f32>` bound to a Babylon Lite custom WGSL material.
- Explicit layer selection with `textureSample(iconArray, sampler, uv, layer)`.
- Sampler wrapping in both U and V with `addressModeU/V: "repeat"`.
- A layer index that advances once per second and wraps from layer 4 to 0.
- MSDF edge reconstruction in the fragment shader.
- A procedural blue/gold heraldic checkerboard underneath the sampled icon.

## Requirements

- Node.js 24+
- pnpm 11+
- A WebGPU-capable browser (recent Chrome, Edge, Firefox, or Safari)

## Local development

```sh
pnpm install
pnpm generate:icons
pnpm dev
```

Open the local URL printed by Vite. Build the production bundle with:

```sh
pnpm build
```

## Babylon Lite Playground

A [reduced example in the Babylon Lite Playground](https://liteplayground.babylonjs.com/snippet/YUW4PZ/v/0)
contains the flag, texture array, MSDF sampling and UV repeat without the
inspector. It loads the layer PNGs from this repository's GitHub Pages
deployment.

## MSDF asset pipeline

`scripts/generate-icons.ts` uses `msdf-bmfont-xml` and the bundled Material
Icons TTF to create the source assets:

- `public/icons/layers/*.png` — one 256×256 MSDF PNG for every texture-array
  layer.

Each texture-array layer must have identical width, height, and format. The
generator therefore extracts every glyph from the MSDF atlas and centers it in
its own 256×256 layer before the application uploads the images to the GPU.

## Third-party asset

`assets/MaterialIcons-Regular.ttf` is derived from Google Material Icons and is
included solely to make the MSDF generation script reproducible. Google
licenses Material Icons under Apache-2.0; see the upstream
[license](https://github.com/google/material-design-icons/blob/master/LICENSE).

## Project structure

```text
assets/                     Material Icons source font (Apache-2.0)
public/icons/layers/        Generated MSDF layer PNGs
scripts/generate-icons.ts   MSDF generation and layer extraction
src/main.ts                 Babylon Lite scene and WGSL shader
src/style.css               Inspector UI
.github/workflows/deploy.yml GitHub Pages deployment
```
