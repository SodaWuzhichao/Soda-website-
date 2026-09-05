#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const ignored = new Set(['.git', 'node_modules', 'vendor']);

function htmlFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    if (ignored.has(name)) return [];
    const path = join(directory, name);
    const stats = statSync(path);
    if (stats.isDirectory()) return htmlFiles(path);
    return extname(name).toLowerCase() === '.html' ? [path] : [];
  });
}

const failures = [];
let checked = 0;

for (const file of htmlFiles(root)) {
  const html = readFileSync(file, 'utf8');
  const scripts = html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi);
  let inlineIndex = 0;

  for (const match of scripts) {
    const attributes = match[1];
    const source = match[2].trim();
    if (!source || /\bsrc\s*=/i.test(attributes)) continue;
    if (/\btype\s*=\s*["'](?:module|application\/(?:json|ld\+json))["']/i.test(attributes)) continue;

    inlineIndex += 1;
    checked += 1;
    try {
      new vm.Script(source, { filename: `${relative(root, file)}#inline-${inlineIndex}` });
    } catch (error) {
      failures.push(error.message);
    }
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Validated ${checked} inline scripts.`);
