#!/usr/bin/env node

/**
 * Verifies that package.json is the single source of truth for package,
 * Cargo, and plugin manifest versions. Used in CI to catch version drift.
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Read package.json version
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
const packageVersion = packageJson.version;

function readJsonVersion(relativePath) {
  return JSON.parse(readFileSync(join(rootDir, relativePath), 'utf-8')).version;
}

// Read Cargo.toml version
const cargoToml = readFileSync(join(rootDir, 'cli/Cargo.toml'), 'utf-8');
const cargoVersionMatch = cargoToml.match(/^version\s*=\s*"([^"]*)"/m);

if (!cargoVersionMatch) {
  console.error('Could not find version in cli/Cargo.toml');
  process.exit(1);
}

const cargoVersion = cargoVersionMatch[1];

// Read package and plugin manifest versions
const dashboardVersion = readJsonVersion('packages/dashboard/package.json');
const claudePluginVersion = readJsonVersion('.claude-plugin/plugin.json');
const codexPluginVersion = readJsonVersion('.codex-plugin/plugin.json');

const mismatches = [];
if (packageVersion !== cargoVersion) {
  mismatches.push(`  cli/Cargo.toml:              ${cargoVersion}`);
}
if (packageVersion !== dashboardVersion) {
  mismatches.push(`  packages/dashboard:          ${dashboardVersion}`);
}
if (packageVersion !== claudePluginVersion) {
  mismatches.push(`  .claude-plugin/plugin.json:  ${claudePluginVersion}`);
}
if (packageVersion !== codexPluginVersion) {
  mismatches.push(`  .codex-plugin/plugin.json:   ${codexPluginVersion}`);
}

if (mismatches.length > 0) {
  console.error('Version mismatch detected!');
  console.error(`  package.json:                ${packageVersion}`);
  for (const m of mismatches) console.error(m);
  console.error('');
  console.error("Run 'pnpm run version:sync' to fix this.");
  process.exit(1);
}

console.log(`Versions are in sync: ${packageVersion}`);
