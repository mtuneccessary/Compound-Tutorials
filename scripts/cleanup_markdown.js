const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');

/**
 * Recursively walk a directory and yield absolute file paths
 * @param {string} dir
 */
function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else {
      yield fullPath;
    }
  }
}

/**
 * Convert <figure><img ...></figure> blocks to Markdown images
 */
function convertFigureBlocks(markdown) {
  const figureRegex = /<figure>\s*<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>\s*(?:<figcaption>(.*?)<\/figcaption>)?\s*<\/figure>/gms;
  return markdown.replace(figureRegex, (_, src, alt, caption) => {
    const text = (caption && caption.trim()) || (alt && alt.trim()) || '';
    // Decode HTML entity &#x26; to & inside URLs (GitBook encodes ampersands)
    const decodedSrc = src.replace(/&#x26;/g, '&');
    return `![${text}](${decodedSrc})`;
  });
}

function processFile(filePath) {
  const ext = path.extname(filePath);
  if (ext !== '.md') return false;

  const original = fs.readFileSync(filePath, 'utf8');
  let updated = original;

  updated = convertFigureBlocks(updated);

  if (updated !== original) {
    fs.writeFileSync(filePath, updated, 'utf8');
    return true;
  }
  return false;
}

function main() {
  let changed = 0;
  for (const file of walk(DOCS_DIR)) {
    if (processFile(file)) {
      console.log(`Cleaned ${path.relative(process.cwd(), file)}`);
      changed += 1;
    }
  }
  console.log(`Cleanup complete. ${changed} files modified.`);
}

if (require.main === module) {
  main();
} 