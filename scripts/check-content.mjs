import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import matter from "gray-matter";

const root = process.cwd();
const publicDir = join(root, "public");
const errors = [];
const warnings = [];
const references = new Set();
const assetPattern = /["'(]((?:\/(?!\/))[^"')\s?#]+\.(?:avif|gif|jpe?g|json|pdf|png|svg|webp|woff2?))/gi;
const sourceRoots = ["app", "components", "config", "content", "lib"];
const sourceExtensions = new Set([".css", ".md", ".ts", ".tsx"]);
const managedAssetRoots = ["images", "logos", "publications", "life/baking", "life/craft"];

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

for (const sourceRoot of sourceRoots) {
  for (const file of walk(join(root, sourceRoot))) {
    if (!sourceExtensions.has(extname(file))) continue;
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(assetPattern)) references.add(match[1]);
    if (/\[[^\]]+\]\(\s*\)/.test(text)) warnings.push(`${relative(root, file)} contains an empty Markdown link`);
  }
}

const ids = new Map();
for (const file of walk(join(root, "config/data"))) {
  const text = readFileSync(file, "utf8");
  for (const match of text.matchAll(/\bid:\s*["']([^"']+)["']/g)) {
    const previous = ids.get(match[1]);
    if (previous) errors.push(`duplicate config id "${match[1]}" in ${previous} and ${relative(root, file)}`);
    else ids.set(match[1], relative(root, file));
  }
}

for (const category of ["baking", "craft"]) {
  const contentDir = join(root, "content/life", category);
  for (const file of walk(contentDir).filter((path) => extname(path) === ".md")) {
    const parsed = matter(readFileSync(file, "utf8"));
    const slug = relative(contentDir, file).replace(/\.md$/, "");
    for (const key of ["title", "date", "cover", "square"]) {
      if (!parsed.data[key]) errors.push(`${relative(root, file)} is missing frontmatter field "${key}"`);
    }
    const date = parsed.data.date instanceof Date
      ? parsed.data.date.toISOString().slice(0, 10)
      : String(parsed.data.date ?? "");
    if (date && date !== slug.slice(0, 10)) {
      errors.push(`${relative(root, file)} date must match the first 10 characters of its slug`);
    }
    for (const key of ["cover", "square"]) {
      const value = parsed.data[key];
      if (typeof value === "string" && value.startsWith("/")) references.add(value);
      if (value && !String(value).startsWith(`/life/${category}/${slug}`)) {
        warnings.push(`${relative(root, file)} ${key} does not follow the ${slug}-… naming convention`);
      }
    }
  }
}

for (const ref of references) {
  if (!existsSync(join(publicDir, ref.slice(1)))) errors.push(`missing public asset: ${ref}`);
}

const routeIndexPath = join(publicDir, "routes/index.json");
if (!existsSync(routeIndexPath)) {
  errors.push("missing public/routes/index.json");
} else {
  try {
    const cities = JSON.parse(readFileSync(routeIndexPath, "utf8"));
    if (!Array.isArray(cities) || cities.length === 0) errors.push("route index must contain at least one city");
    for (const city of cities) {
      if (!city.id || !city.zh || !city.en || !Number.isFinite(city.n) || !Number.isFinite(city.km)) {
        errors.push(`invalid route index entry: ${JSON.stringify(city)}`);
        continue;
      }
      const cityPath = join(publicDir, "routes", `${city.id}.json`);
      if (!existsSync(cityPath)) {
        errors.push(`missing route data for city: ${city.id}`);
        continue;
      }
      const data = JSON.parse(readFileSync(cityPath, "utf8"));
      if (!Array.isArray(data.tracks) || data.tracks.length !== city.n) {
        errors.push(`${city.id}.json track count does not match index.json (${data.tracks?.length ?? 0} vs ${city.n})`);
      }
      for (const track of data.tracks ?? []) {
        if (!track.id || !track.d || !track.k || !Number.isFinite(track.km) || !Array.isArray(track.p) || track.p.length < 2) {
          errors.push(`${city.id}.json contains an invalid track`);
          break;
        }
      }
    }
  } catch (error) {
    errors.push(`invalid route JSON: ${error.message}`);
  }
}

const managedAssets = managedAssetRoots.flatMap((dir) =>
  walk(join(publicDir, dir)).map((path) => ({ path, publicPath: `/${relative(publicDir, path)}` }))
);
for (const asset of managedAssets) {
  const size = statSync(asset.path).size;
  if (!references.has(asset.publicPath)) warnings.push(`unreferenced asset: ${asset.publicPath}`);
  if (size > 2 * 1024 * 1024) warnings.push(`large asset (${(size / 1024 / 1024).toFixed(1)} MB): ${asset.publicPath}`);
}

const hashes = new Map();
for (const asset of managedAssets) {
  const hash = createHash("sha256").update(readFileSync(asset.path)).digest("hex");
  const matches = hashes.get(hash) ?? [];
  matches.push(asset.publicPath);
  hashes.set(hash, matches);
}
for (const matches of hashes.values()) {
  if (matches.length > 1) warnings.push(`duplicate assets: ${matches.join(", ")}`);
}

for (const warning of warnings) console.warn(`warning: ${warning}`);
for (const error of errors) console.error(`error: ${error}`);
console.log(`checked ${references.size} references, ${managedAssets.length} managed assets, and ${ids.size} config ids`);
if (errors.length) process.exit(1);
