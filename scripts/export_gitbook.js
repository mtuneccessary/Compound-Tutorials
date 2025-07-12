const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const fs = require('fs');
const path = require('path');

// Base GitBook site URL (without trailing slash)
const BASE_URL = 'https://compound-1.gitbook.io/compoundtutorials';

// Directory where markdown files will be saved (Mintlify expects docs/)
const OUTPUT_ROOT = path.join(__dirname, '..', 'docs');

/**
 * Ensure a directory exists. Creates it recursively if missing.
 * @param {string} dirPath absolute path
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Convert a GitBook page URL to its raw markdown download URL.
 * Example:
 *  https://compound-1.gitbook.io/compoundtutorials/chapter-1 ->
 *  https://compound-1.gitbook.io/compoundtutorials/chapter-1.md
 * @param {string} pageUrl fully-qualified page URL from sitemap
 */
function toMarkdownUrl(pageUrl) {
  // Remove trailing slash so we can safely append .md
  const trimmed = pageUrl.endsWith('/') ? pageUrl.slice(0, -1) : pageUrl;
  return `${trimmed}.md`;
}

/**
 * Given a page URL, derive the local file path under docs/ where we should
 * save the markdown file, mirroring the GitBook path.
 * Root page becomes docs/index.md.
 */
function toLocalPath(pageUrl) {
  // Remove base prefix
  const relative = pageUrl.replace(`${BASE_URL}/`, '');
  // If the page url *is* the base url, treat it as index.md
  if (relative === '' || relative === BASE_URL) {
    return path.join(OUTPUT_ROOT, 'index.md');
  }
  return path.join(OUTPUT_ROOT, `${relative}.md`);
}

async function fetchSitemap() {
  const sitemapIndex = `${BASE_URL}/sitemap-pages.xml`;
  const { data } = await axios.get(sitemapIndex);
  const xml = await parseStringPromise(data);
  // xml.urlset.url is an array of url objects
  const locs = xml.urlset.url.map((u) => u.loc[0]);
  return locs;
}

async function downloadAll() {
  console.log('Fetching sitemap...');
  const pages = await fetchSitemap();
  console.log(`Found ${pages.length} pages.`);

  for (const pageUrl of pages) {
    try {
      const mdUrl = toMarkdownUrl(pageUrl);
      const localPath = toLocalPath(pageUrl);
      console.log(`Downloading ${mdUrl} -> ${path.relative(process.cwd(), localPath)}`);

      const response = await axios.get(mdUrl);
      const content = response.data;

      ensureDir(path.dirname(localPath));
      fs.writeFileSync(localPath, content, 'utf8');
    } catch (err) {
      console.warn(`Failed to download ${pageUrl}: ${err.message}`);
    }
  }
  console.log('Done. Markdown files saved to docs/.');
}

if (require.main === module) {
  downloadAll().catch((e) => {
    console.error(e);
    process.exit(1);
  });
} 