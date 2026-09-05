#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const required = [
  'CNAME',
  'index.html',
  'admin/index.html',
  'tools/index.html',
  'tools/transcribe.html',
  'tools/douyin.html',
  'tools/music-converter.html',
  'tools/video-subtitle-remover.html',
];
const failures = required.filter((path) => !existsSync(join(root, path))).map((path) => `Missing entrypoint: ${path}`);

const toolsIndexPath = join(root, 'tools/index.html');
const toolsHtml = readFileSync(toolsIndexPath, 'utf8');
for (const match of toolsHtml.matchAll(/<a\b[^>]*\bhref=["']([^"']+\.html)["']/gi)) {
  const target = join(dirname(toolsIndexPath), match[1]);
  if (!existsSync(target)) failures.push(`Broken tool link: ${match[1]}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Static entrypoints and tool links are valid.');
