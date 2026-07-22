import "./style.css";
import {
  addToScene,
  attachControl,
  createArcRotateCamera,
  createEngine,
  createGround,
  createHemisphericLight,
  createSceneContext,
  createShaderMaterial,
  createTexture2DArrayFromUrls,
  onBeforeRender,
  registerScene,
  setShaderTexture,
  setShaderUniform,
  startEngine,
  vec3,
} from "@babylonjs/lite";

const iconNames = ["home", "favorite", "star", "face", "pets"] as const;
const canvas = document.querySelector<HTMLCanvasElement>("#renderCanvas")!;
const unsupported = document.querySelector<HTMLElement>("#unsupported")!;
const layerCards = document.querySelectorAll<HTMLElement>(".icon-layer-card");

if (!("gpu" in navigator)) {
  unsupported.hidden = false;
  throw new Error("WebGPU is required for this Babylon Lite example.");
}

const vertexSource = /* wgsl */ `
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};
@vertex fn mainVertex(input: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  let pinned = input.uv.x;
  let wave = sin(shaderUniforms.time * 2.3 + input.uv.x * 6.0 + input.uv.y * 1.3) * 0.22 * pinned;
  let ripple = sin(shaderUniforms.time * 3.4 + input.uv.x * 14.0 - input.uv.y * 3.0) * 0.05 * pinned;
  let displaced = input.position + vec3<f32>(0.0, 0.0, wave + ripple);
  out.position = shaderSystem.worldViewProjection * vec4<f32>(displaced, 1.0);
  out.uv = input.uv;
  return out;
}`;

const fragmentSource = /* wgsl */ `
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};
fn median(rgb: vec3<f32>) -> f32 { return max(min(rgb.r, rgb.g), min(max(rgb.r, rgb.g), rgb.b)); }
@fragment fn mainFragment(input: VertexOutput) -> @location(0) vec4<f32> {
  // Ground UVs run opposite to the top-left image origin used by the generated PNGs.
  // Flip V once before repeating; the same coordinates still drive the grid and texture array.
  let tiledUv = vec2<f32>(input.uv.x, 1.0 - input.uv.y) * 2.0;
  let darkSquare = (tiledUv.x > 1.0) != (tiledUv.y > 1.0);
  let dark = vec3<f32>(0.08, 0.20, 0.42);
  let light = vec3<f32>(0.80, 0.58, 0.23);
  let heraldry = select(light, dark, darkSquare);

  let msdf = textureSample(iconArray, iconArraySampler, tiledUv, i32(shaderUniforms.layer));
  let signedDistance = median(msdf.rgb) - 0.5;
  let smoothing = max(fwidth(signedDistance), 0.006);
  let iconAlpha = smoothstep(-smoothing, smoothing, signedDistance);
  let ink = vec3<f32>(0.97, 0.92, 0.79);
  return vec4<f32>(mix(heraldry, ink, iconAlpha), 1.0);
}`;

const engine = await createEngine(canvas);
const scene = createSceneContext(engine);
const camera = createArcRotateCamera(-1.3, 1.18, 7.2, vec3(0, 0.25, 0));
scene.camera = camera;
attachControl(camera, canvas, scene);
addToScene(scene, createHemisphericLight([0, 1, 0], 1.2));

const flag = createGround(engine, { width: 4.4, height: 3.0, subdivisions: 40 });
flag.rotation.x = Math.PI / 2;
flag.position.set(0, 0.2, 0);
const material = createShaderMaterial({
  name: "textureArrayHeraldry",
  attributes: ["position", "uv"],
  uniforms: ["worldViewProjection", { name: "time", type: "f32", defaultValue: 0 }, { name: "layer", type: "f32", defaultValue: 0 }],
  samplers: [{ name: "iconArray", viewDimension: "2d-array" }],
  vertexSource,
  fragmentSource,
  backFaceCulling: false,
});
flag.material = material;
addToScene(scene, flag);

const urls = iconNames.map((name) => `${import.meta.env.BASE_URL}icons/layers/${name}.png`) as [string, ...string[]];
const icons = await createTexture2DArrayFromUrls(engine, urls, { mipMaps: true, addressModeU: "repeat", addressModeV: "repeat" });
setShaderTexture(material, "iconArray", icons);

let layer = 0;
let elapsed = 0;
function showLayer() {
  setShaderUniform(material, "layer", layer);
  for (const card of layerCards) {
    card.classList.toggle("is-active", Number(card.dataset.layer) === layer);
  }
}
showLayer();

onBeforeRender(scene, (deltaMs: number) => {
  elapsed += deltaMs / 1000;
  setShaderUniform(material, "time", elapsed);
  const nextLayer = Math.floor(elapsed) % iconNames.length;
  if (nextLayer !== layer) { layer = nextLayer; showLayer(); }
});

await registerScene(scene);
await startEngine(engine);
