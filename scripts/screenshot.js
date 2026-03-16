/**
 * Captures Tripplanner screenshots (mobile + desktop) after demo state loads.
 * Run: npm run serve (in one terminal), then npm run screenshot
 * Or: npm run screenshot -- --serve
 */

const path = require("path");
const fs = require("fs");
const http = require("http");
const url = require("url");

const PORT = 8125;
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "screenshots");
const BOOTSTRAP_URL = `http://localhost:${PORT}/screenshots/bootstrap-demo.html`;

function createStaticServer() {
  const mime = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
  };
  return http.createServer((req, res) => {
    const pathname = url.parse(req.url).pathname || "/";
    let p = path.join(ROOT, pathname === "/" ? "index.html" : pathname.replace(/^\//, ""));
    p = path.normalize(p);
    if (!p.startsWith(ROOT)) {
      res.writeHead(403);
      res.end();
      return;
    }
    const ext = path.extname(p);
    fs.readFile(p, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream" });
      res.end(data);
    });
  });
}

async function waitForServer() {
  for (let i = 0; i < 30; i++) {
    try {
      await new Promise((resolve, reject) => {
        http.get(`http://localhost:${PORT}`, (r) => resolve()).on("error", reject);
      });
      return true;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

async function main() {
  let server;
  const startServer = process.argv.includes("--serve");
  if (startServer) {
    server = createStaticServer();
    server.listen(PORT, () => {});
    await new Promise((r) => setTimeout(r, 500));
    const ready = await waitForServer();
    if (!ready) {
      console.error("Server failed to start.");
      process.exit(1);
    }
  } else {
    const ready = await waitForServer();
    if (!ready) {
      console.error("Server not running. Start with: npm run serve");
      console.error("Or run: npm run screenshot -- --serve");
      process.exit(1);
    }
  }

  try {
    const { chromium } = require("playwright");
    const browser = await chromium.launch({ headless: true });
    fs.mkdirSync(OUT_DIR, { recursive: true });

    // Load demo state (redirects to index.html)
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(BOOTSTRAP_URL, { waitUntil: "networkidle" });
    await page.waitForSelector(".chat-card, .conversation", { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 800));

    await page.screenshot({ path: path.join(OUT_DIR, "ux-desktop-after-fix.png"), fullPage: false });
    console.log("Desktop screenshot saved to screenshots/ux-desktop-after-fix.png");

    // Mobile viewport
    const mobilePage = await browser.newPage({ viewport: { width: 430, height: 900 } });
    await mobilePage.goto(BOOTSTRAP_URL, { waitUntil: "networkidle" });
    await mobilePage.waitForSelector(".chat-card, .conversation", { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 800));

    await mobilePage.screenshot({ path: path.join(OUT_DIR, "ux-mobile-after-fix.png"), fullPage: false });
    console.log("Mobile screenshot saved to screenshots/ux-mobile-after-fix.png");

    await browser.close();
  } finally {
    if (server && server.close) server.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
