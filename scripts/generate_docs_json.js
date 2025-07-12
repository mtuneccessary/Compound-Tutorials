const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const OUTPUT_FILE = path.join(__dirname, '..', 'docs.json');

function listMarkdown(dir) {
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
}

function slug(filePath) {
  return filePath.replace(/\.md$/, '');
}

function main() {
  const navigation = [];

  // Handle top-level markdown files
  for (const file of listMarkdown(DOCS_DIR)) {
    const title = file.replace(/-/g, ' ').replace(/\.md$/, '');
    navigation.push(slug(file));
  }

  // Handle chapter directories
  for (const entry of fs.readdirSync(DOCS_DIR, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const dirName = entry.name;
      const mdFiles = listMarkdown(path.join(DOCS_DIR, dirName));
      if (mdFiles.length === 0) continue;

      // Group display name -> dirName with dashes replaced by space and capitalize first letter
      const groupName = dirName.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

      const pages = mdFiles.map((f) => `${dirName}/${slug(f)}`);
      navigation.push({ group: groupName, pages });
    }
  }

  const config = {
    navigation,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(config, null, 2));
  console.log(`Generated ${path.relative(process.cwd(), OUTPUT_FILE)}`);
}

if (require.main === module) {
  main();
} 