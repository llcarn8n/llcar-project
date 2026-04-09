#!/usr/bin/env node
/**
 * transform-kb.mjs — Transform flat KB structure to brand/model/generation hierarchy
 *
 * Usage:
 *   node scripts/transform-kb.mjs --brand kia --models rio,k5
 *   node scripts/transform-kb.mjs --brand kia --all
 *
 * Source: D:\transfer4\knowledge-base\brands\{brand}\
 * Target: public/data/kb/{brand}/
 */

import { readFile, writeFile, mkdir, readdir, copyFile, stat } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const KB_ROOT = 'D:\\transfer4\\knowledge-base\\brands';
const OUT_ROOT = join(PROJECT_ROOT, 'public', 'data', 'kb');

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const { values: args } = parseArgs({
  options: {
    brand:  { type: 'string' },
    models: { type: 'string' },
    all:    { type: 'boolean', default: false },
  },
  strict: false,
});

if (!args.brand) {
  console.error('Usage: node scripts/transform-kb.mjs --brand <brand> [--models m1,m2 | --all]');
  process.exit(1);
}

const BRAND = args.brand.toLowerCase();
const BRAND_SRC = join(KB_ROOT, BRAND);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Safely read JSON, return null on failure */
async function readJson(path) {
  try {
    const raw = await readFile(path, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Safely read text file, return null on failure */
async function readText(path) {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    return null;
  }
}

/** Write JSON (compact) */
async function writeJson(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data), 'utf-8');
}

/** Write text file */
async function writeText(path, text) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, text, 'utf-8');
}

/** Check if a file exists */
async function fileExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Derive generation folder name from generation name.
 * "K5 I 2020-2024"  -> "k5_i_2020"
 * "K5 II 2023-н.в." -> "k5_ii_2023"
 * "Rio I 2017-2024" -> "rio_i_2017"
 * "Rio III 2023-2024" -> "rio_iii_2023"
 */
function genFolderName(genName) {
  // Take the generation name, lowercase, replace spaces with underscores
  let name = genName.toLowerCase();
  // Remove trailing year range after start year: keep only "rio_i_2017"
  // Pattern: "rio i 2017-2024" or "k5 ii 2023-н.в."
  name = name
    .replace(/[-.]+н\.в\.?/g, '')     // remove "-н.в."
    .replace(/[-.]+\d{4,}/g, '')       // remove "-2024" etc
    .replace(/\s+/g, '_')             // spaces to underscores
    .replace(/[^a-z0-9_]/g, '');      // strip non-alphanumeric
  return name;
}

// ---------------------------------------------------------------------------
// Video parser: extract videos from video.md
// ---------------------------------------------------------------------------
function parseVideos(md) {
  if (!md) return [];
  const videos = [];
  const blocks = md.split(/^###\s+/m).filter(Boolean);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    const title = lines[0]?.trim() || '';
    if (!title) continue;

    // Find YouTube/Rutube URL
    let url = null;
    let channel = null;
    let views = null;
    let duration = null;

    for (const line of lines) {
      // Pattern: **Видео:** [32:57](https://www.youtube.com/watch?v=xxx) | Канал: Name | 84,136 просмотров
      const videoMatch = line.match(/\*\*Видео:\*\*\s*\[([^\]]*)\]\(([^)]+)\)/);
      if (videoMatch) {
        duration = videoMatch[1];
        url = videoMatch[2];
        const channelMatch = line.match(/Канал:\s*([^|]+)/);
        if (channelMatch) channel = channelMatch[1].trim();
        const viewsMatch = line.match(/([\d,]+)\s*просмотр/);
        if (viewsMatch) views = viewsMatch[1].replace(/,/g, '');
      }

      // Pattern: > Видео: [Name](https://rutube.ru/video/xxx/) (14 мин)
      const rutubeMatch = line.match(/>\s*Видео:\s*\[([^\]]*)\]\(([^)]+)\)\s*\(([^)]+)\)/);
      if (rutubeMatch) {
        channel = rutubeMatch[1];
        url = rutubeMatch[2];
        duration = rutubeMatch[3];
      }

      // Fallback: any http line
      if (!url) {
        const urlMatch = line.match(/Источник:\s*(https?:\/\/[^\s]+)/);
        if (urlMatch) url = urlMatch[1];
      }
    }

    if (title && url) {
      const entry = { title, url };
      if (duration) entry.duration = duration;
      if (channel) entry.channel = channel;
      if (views) entry.views = parseInt(views, 10) || undefined;
      videos.push(entry);
    }
  }
  return videos;
}

// ---------------------------------------------------------------------------
// Reviews parser: extract key sections from reviews.md
// ---------------------------------------------------------------------------
function parseReviews(md) {
  if (!md) return [];
  const reviews = [];
  const blocks = md.split(/^###\s+/m).filter(Boolean);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    const title = lines[0]?.trim() || '';
    if (!title) continue;

    // Find source URL
    let source = null;
    for (const line of lines) {
      const srcMatch = line.match(/\[Source\]\(([^)]+)\)/);
      if (srcMatch) { source = srcMatch[1]; break; }
    }

    // Collect non-empty content lines (skip metadata lines with backticks)
    const contentLines = lines.slice(1).filter(l => {
      const t = l.trim();
      return t && !t.startsWith('`') && !t.startsWith('[Source]');
    });

    // Take first meaningful lines as quotes (max 10)
    const quotes = contentLines
      .map(l => l.trim())
      .filter(l => l.length > 10 && l.length < 300)
      .slice(0, 10);

    if (title) {
      const entry = { title };
      if (source) entry.source = source;
      if (quotes.length) entry.quotes = quotes;
      reviews.push(entry);
    }
  }
  return reviews;
}

// ---------------------------------------------------------------------------
// Find best manual file for a generation using manual_generations.json
// ---------------------------------------------------------------------------
/**
 * Find best manual file for a generation.
 * Uses manual_generations.json metadata + filename heuristics + fallbacks.
 * Also accepts the list of actual files in the model directory.
 */
function findManualForGeneration(manualGens, genId, genName, modelId, modelFiles) {
  if (!manualGens && (!modelFiles || modelFiles.length === 0)) return null;

  const entries = manualGens ? Object.entries(manualGens) : [];

  // Priority 1: exact generation_id match
  for (const [file, meta] of entries) {
    if (meta.generation_id === genId) return file;
  }

  // Priority 2: generation name match
  for (const [file, meta] of entries) {
    if (meta.generation === genName) return file;
  }

  // Parse generation info: "Rio III 2023-2024" -> model=rio, roman=iii, year=2023
  const genMatch = genName.match(/(\w+)\s+(I{1,3}V?|V?I{0,3})\s+(\d{4})/i);
  const model = modelId.toLowerCase();
  let roman = null, year = null;
  if (genMatch) {
    roman = genMatch[2].toLowerCase();
    year = genMatch[3];
  }

  // Priority 3: filename contains roman numeral + year (in manual_generations keys)
  if (roman && year) {
    for (const [file] of entries) {
      const fl = file.toLowerCase();
      if (fl.includes(roman) && fl.includes(year)) return file;
    }
  }

  // Priority 4: filename contains model + year (with generation tag pattern)
  // e.g., manual-rio_2021-i_2017_2024.md for Rio facelift 2021
  if (year) {
    // Look for files like manual-{model}_{year}*.md
    for (const [file] of entries) {
      const fl = file.toLowerCase();
      if (fl.includes(model) && fl.includes(`_${year}`)) return file;
    }
    // Relaxed: any file containing the year
    for (const [file] of entries) {
      const fl = file.toLowerCase();
      if (fl.includes(year) && !fl.includes('_all')) return file;
    }
    // Try year +/- 1 (for facelift variants where naming is off by a year)
    const yearNum = parseInt(year, 10);
    for (const delta of [1, -1]) {
      const nearYear = String(yearNum + delta);
      for (const [file] of entries) {
        const fl = file.toLowerCase();
        if (fl.includes(model) && fl.includes(nearYear)) return file;
      }
    }
  }

  // Priority 5: look for actual manual files on disk matching patterns
  if (modelFiles) {
    const manualFiles = modelFiles.filter(f => f.startsWith('manual-') && f.endsWith('.md'));
    if (roman && year) {
      // manual-{model}-{roman}_{year}*.md  e.g., manual-k5-ii_2023_н_в.md
      const found = manualFiles.find(f => {
        const fl = f.toLowerCase();
        return fl.includes(roman) && fl.includes(year);
      });
      if (found) return found;
    }
    if (year) {
      const found = manualFiles.find(f => f.toLowerCase().includes(year));
      if (found) return found;
    }
  }

  // Priority 6: fallback to manual-{model}.md or manual.md
  const fallbackName = `manual-${modelId}.md`;
  if (manualGens && manualGens[fallbackName]) return fallbackName;

  // Last resort: manual.md exists on disk
  if (modelFiles && modelFiles.includes('manual.md')) return 'manual.md';

  return null;
}

// ---------------------------------------------------------------------------
// Process one model
// ---------------------------------------------------------------------------
async function processModel(brand, modelId, manifest) {
  const modelSrc = join(BRAND_SRC, 'models', modelId);
  const modelOut = join(OUT_ROOT, brand, modelId);

  // Read core model data
  const info = await readJson(join(modelSrc, 'info.json'));
  if (!info || !info.generations || info.generations.length === 0) {
    console.log(`  [SKIP] ${modelId}: no info.json or no generations`);
    return { model: modelId, generations: 0, files: 0 };
  }

  const keywords = await readJson(join(modelSrc, 'keywords.json'));
  const situations = await readJson(join(modelSrc, 'situations.json'));
  const dtcModel = await readJson(join(modelSrc, 'dtc-model.json'));
  const dtcFallback = await readJson(join(modelSrc, 'dtc.json'));
  const dtcData = dtcModel || dtcFallback;
  const manualGens = await readJson(join(modelSrc, 'manual_generations.json'));
  const videoMd = await readText(join(modelSrc, 'video.md'));
  const reviewsMd = await readText(join(modelSrc, 'reviews.md'));

  // List actual files in model directory (for manual fallback matching)
  let modelFiles = [];
  try { modelFiles = await readdir(modelSrc); } catch { /* ignore */ }

  // Also read _all situations (shared across all models)
  const allSituations = await readJson(join(BRAND_SRC, 'models', '_all', 'situations.json'));

  console.log(`  Processing ${brand}/${modelId}... ${info.generations.length} generation(s) found`);

  let totalFiles = 0;

  // Write _model.json
  const modelMeta = {
    model_id: modelId,
    model_name: info.model_name,
    brand_id: brand,
    body_type: info.body_type,
    status: info.status,
    powertrain: info.powertrain,
    generations_count: info.generations.length,
  };
  if (keywords) {
    modelMeta.description_ru = keywords.description_ru;
    modelMeta.character = keywords.character;
    modelMeta.pros = keywords.pros;
    modelMeta.cons = keywords.cons;
    modelMeta.target_audience = keywords.target_audience;
    modelMeta.total_reviews = keywords.total_reviews;
  }
  await writeJson(join(modelOut, '_model.json'), modelMeta);
  totalFiles++;

  // Parse videos and reviews once (shared across generations)
  const allVideos = parseVideos(videoMd);
  const allReviews = parseReviews(reviewsMd);

  // Process each generation
  for (const gen of info.generations) {
    const genFolder = genFolderName(gen.name);
    const genOut = join(modelOut, genFolder);
    await mkdir(genOut, { recursive: true });

    let genFiles = 0;

    // --- situations.json ---
    // Filter situations for this model: models includes modelId or "_all"
    // Also merge in brand-level _all situations
    const modelSituations = (situations || []).filter(s => {
      if (!s.models) return true; // no model filter = include
      return s.models.includes(modelId) || s.models.includes('_all');
    });
    const brandSituations = (allSituations || []).filter(s => {
      if (!s.models) return false;
      return s.models.includes('_all');
    });
    // Merge, avoiding duplicates by id
    const seenIds = new Set(modelSituations.map(s => s.id));
    const mergedSituations = [...modelSituations];
    for (const s of brandSituations) {
      if (!seenIds.has(s.id)) {
        mergedSituations.push(s);
        seenIds.add(s.id);
      }
    }
    if (mergedSituations.length > 0) {
      // Output compact: only essential fields
      const compactSituations = mergedSituations.map(s => ({
        id: s.id,
        title: s.title,
        title_en: s.title_en,
        urgency: s.urgency,
        severity: s.severity,
        category: s.category,
        quickAnswer: s.quickAnswer,
        action_ru: s.action_ru,
        level1_ru: s.level1_ru,
        facts_ru: s.facts_ru,
        dtc_codes: s.dtc_codes,
        priceData: s.priceData,
        season: s.season,
      }));
      await writeJson(join(genOut, 'situations.json'), compactSituations);
      genFiles++;
    }

    // --- dtc.json ---
    if (dtcData && dtcData.codes) {
      // Output as array of {code, ...properties}
      const dtcArray = Object.entries(dtcData.codes).map(([code, data]) => ({
        code,
        note_ru: data.note_ru,
        note_en: data.note_en,
        common_fix_ru: data.common_fix_ru,
        frequency: data.frequency,
        severity: data.severity_override,
        system_id: data.system_id,
        can_drive: data.can_drive,
      }));
      await writeJson(join(genOut, 'dtc.json'), dtcArray);
      genFiles++;
    }

    // --- manual.md ---
    const manualFile = findManualForGeneration(manualGens, gen.id, gen.name, modelId, modelFiles);
    if (manualFile) {
      const manualPath = join(modelSrc, manualFile);
      if (await fileExists(manualPath)) {
        let manualContent = await readText(manualPath);
        if (manualContent) {
          // Fix image paths: ../../../images/hash.webp -> /data/kb/_images/hash.webp
          manualContent = manualContent.replace(
            /(?:\.\.\/)+images\//g,
            `/data/kb/_images/`
          );
          await writeText(join(genOut, 'manual.md'), manualContent);
          genFiles++;
        }
      } else {
        console.log(`    [WARN] Manual file not found: ${manualFile}`);
      }
    }

    // --- videos.json ---
    if (allVideos.length > 0) {
      await writeJson(join(genOut, 'videos.json'), allVideos);
      genFiles++;
    }

    // --- reviews.json ---
    if (allReviews.length > 0) {
      await writeJson(join(genOut, 'reviews.json'), allReviews);
      genFiles++;
    }

    // --- meta.json ---
    const meta = {
      generation_id: gen.id,
      generation_name: gen.name,
      original_name: gen.original_name,
      year_start: gen.ys,
      year_end: gen.ye,
      body_type: gen.body_type,
      dimensions: gen.dimensions,
      engines_summary: gen.engines_summary,
      transmissions_summary: gen.transmissions_summary,
      drivetrains_summary: gen.drivetrains_summary,
      trims_count: gen.trims?.length || 0,
    };
    await writeJson(join(genOut, 'meta.json'), meta);
    genFiles++;

    totalFiles += genFiles;
    console.log(`    ${genFolder}/  -> ${genFiles} files`);
  }

  return { model: modelId, generations: info.generations.length, files: totalFiles };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n=== KB Transform: ${BRAND} ===`);
  console.log(`Source: ${BRAND_SRC}`);
  console.log(`Output: ${join(OUT_ROOT, BRAND)}\n`);

  // Read manifest
  const manifest = await readJson(join(BRAND_SRC, 'manifest.json'));
  if (!manifest) {
    console.error(`[ERROR] Cannot read manifest.json for brand "${BRAND}"`);
    process.exit(1);
  }

  // Determine models to process
  let modelIds;
  if (args.all) {
    // Get all model directories that have info.json (skip _all, aliases, etc.)
    modelIds = manifest.models
      .filter(m => m.id && m.id !== '_all')
      .map(m => m.id);
  } else if (args.models) {
    modelIds = args.models.split(',').map(m => m.trim().toLowerCase());
  } else {
    console.error('Specify --models m1,m2 or --all');
    process.exit(1);
  }

  console.log(`Models to process: ${modelIds.join(', ')}\n`);

  // Write _brand.json
  const brandOut = join(OUT_ROOT, BRAND);
  await mkdir(brandOut, { recursive: true });
  const brandMeta = {
    brand_id: manifest.brand_id,
    brand_name: manifest.brand_name,
    country: manifest.country,
    tier: manifest.tier,
    powertrain_types: manifest.powertrain_types,
    models_count: manifest.models.filter(m => m.id !== '_all').length,
    data_stats: manifest.data_stats,
  };
  await writeJson(join(brandOut, '_brand.json'), brandMeta);
  console.log(`  Wrote _brand.json`);

  // Process each model
  const results = [];
  for (const modelId of modelIds) {
    try {
      const result = await processModel(BRAND, modelId, manifest);
      results.push(result);
    } catch (err) {
      console.error(`  [ERROR] ${modelId}: ${err.message}`);
      results.push({ model: modelId, generations: 0, files: 0, error: err.message });
    }
  }

  // Summary
  console.log(`\n=== Summary ===`);
  let totalGens = 0, totalFiles = 0;
  for (const r of results) {
    console.log(`  ${r.model}: ${r.generations} gen(s), ${r.files} file(s)${r.error ? ` [ERROR: ${r.error}]` : ''}`);
    totalGens += r.generations;
    totalFiles += r.files;
  }
  console.log(`  TOTAL: ${results.length} model(s), ${totalGens} generation(s), ${totalFiles} file(s)`);
  console.log(`  Output: ${join(OUT_ROOT, BRAND)}\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
