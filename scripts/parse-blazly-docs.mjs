/**
 * Parses scripts/blazly-doc-export.txt into src/content/docs/generated-data.ts
 * Run: node scripts/parse-blazly-docs.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const INPUT = path.join(__dirname, "blazly-doc-export.txt");
const OUTPUT = path.join(ROOT, "src/content/docs/generated-data.ts");

const PRODUCTS = [
  { name: "Blazly Local SEO", slug: "local-seo" },
  { name: "Blazly GEO", slug: "geo" },
  { name: "Blazly Backlinker", slug: "backlinker" },
  { name: "Blazly Lead Engine", slug: "lead-engine" },
  { name: "Blazly Social", slug: "social" },
  { name: "Blazly SEO", slug: "seo" },
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeTs(str) {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "")
    .replace(/\n/g, "\\n");
}

function isProductLine(line, productName) {
  return line.trim() === productName;
}

function findProductRanges(lines) {
  const ranges = [];
  for (const product of PRODUCTS) {
    const idx = lines.findIndex((l) => l.trim() === product.name);
    if (idx === -1) throw new Error(`Product not found: ${product.name}`);
    ranges.push({ ...product, start: idx });
  }
  for (let i = 0; i < ranges.length; i++) {
    ranges[i].end = i < ranges.length - 1 ? ranges[i + 1].start : lines.length;
  }
  return ranges;
}

function isLikelyHeading(line) {
  if (!line || line.startsWith("*")) return false;
  if (line.length > 80) return false;
  if (/[.!?]$/.test(line) && line.length > 40) return false;
  return /^[A-Z0-9]/.test(line);
}

function findArticleStarts(lines, start, end, productName) {
  const starts = [];

  for (let i = start + 1; i < end; i++) {
    const line = lines[i]?.trim() ?? "";
    if (!line || isProductLine(line, productName)) continue;
    if (line.startsWith("*")) continue;

    const next = lines[i + 1]?.trim() ?? "";

    if (line === next && line.length < 100) {
      starts.push({ index: i, title: line.replace(/\.+$/, "") });
      i++;
      continue;
    }

    if (starts.length === 0 && /^Onboarding/i.test(line)) {
      starts.push({ index: i, title: line.replace(/\.+$/, "") });
      continue;
    }

    if (isLikelyHeading(line) && !next) {
      let k = i + 1;
      while (k < end && !lines[k]?.trim()) k++;
      const after = lines[k]?.trim() ?? "";
      if (!after) continue;
      if (after === line) continue;
      const already = starts.some((s) => s.index === i);
      if (!already && (after === lines[k + 1]?.trim() || isLikelyHeading(after))) {
        const prevStart = starts[starts.length - 1]?.index ?? start;
        const between = lines.slice(prevStart, i).join("\n").trim();
        if (between.length < 20 || line === "Review Management") {
          starts.push({ index: i, title: line.replace(/\.+$/, "") });
        }
      }
    }
  }

  if (starts.length === 0) {
    starts.push({ index: start + 1, title: "Overview" });
  }

  return starts;
}

function parseContentLines(lines) {
  const blocks = [];
  let bulletBuffer = [];

  function flushBullets() {
    if (bulletBuffer.length) {
      blocks.push({ type: "ul", items: [...bulletBuffer] });
      bulletBuffer = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) {
      flushBullets();
      continue;
    }

    const bulletMatch = raw.match(/^(\s*)\*\s+(.*)$/);
    if (bulletMatch) {
      bulletBuffer.push(bulletMatch[2].trim());
      continue;
    }

    flushBullets();

    const next = lines[i + 1]?.trim() ?? "";
    const nextIsBullet = next.startsWith("*") || /^\s+\*/.test(lines[i + 1] ?? "");

    if (isLikelyHeading(line) && (nextIsBullet || (next && next !== line && !next.startsWith("*")))) {
      if (line === next) {
        i++;
        blocks.push({ type: "h2", text: line.replace(/\.+$/, "") });
        continue;
      }
      if (nextIsBullet || (isLikelyHeading(next) && next.length < 80)) {
        blocks.push({ type: "h3", text: line.replace(/\.+$/, "") });
        continue;
      }
    }

    blocks.push({ type: "p", text: line });
  }

  flushBullets();
  return blocks;
}

function firstParagraph(blocks) {
  const p = blocks.find((b) => b.type === "p");
  if (p) return p.text.slice(0, 160);
  const h = blocks.find((b) => b.type === "h2" || b.type === "h3");
  if (h) return h.text;
  return "";
}

function blocksToSearchText(title, blocks) {
  const parts = [title];
  for (const b of blocks) {
    if (b.type === "p" || b.type === "h2" || b.type === "h3") parts.push(b.text);
    if (b.type === "ul" || b.type === "ol") parts.push(...b.items);
  }
  return parts.join(" ");
}

function uniqueSlug(base, used) {
  let slug = slugify(base);
  if (!used.has(slug)) {
    used.add(slug);
    return slug;
  }
  let n = 2;
  while (used.has(`${slug}-${n}`)) n++;
  const finalSlug = `${slug}-${n}`;
  used.add(finalSlug);
  return finalSlug;
}

function serializeBlock(block, indent) {
  const pad = " ".repeat(indent);
  if (block.type === "p") {
    return `${pad}{ type: "p", text: "${escapeTs(block.text)}" }`;
  }
  if (block.type === "h2") {
    return `${pad}{ type: "h2", text: "${escapeTs(block.text)}" }`;
  }
  if (block.type === "h3") {
    return `${pad}{ type: "h3", text: "${escapeTs(block.text)}" }`;
  }
  if (block.type === "ul" || block.type === "ol") {
    const items = block.items.map((it) => `"${escapeTs(it)}"`).join(", ");
    return `${pad}{ type: "${block.type}", items: [${items}] }`;
  }
  return "";
}

function parseProduct(lines, range) {
  const starts = findArticleStarts(lines, range.start, range.end, range.name);
  const usedSlugs = new Set();
  const articles = [];

  for (let si = 0; si < starts.length; si++) {
    const start = starts[si];
    const end = si < starts.length - 1 ? starts[si + 1].index : range.end;
    let contentLines = lines.slice(start.index, end);

    if (contentLines[0]?.trim() === start.title) {
      contentLines = contentLines.slice(1);
    }
    if (contentLines[0]?.trim() === start.title) {
      contentLines = contentLines.slice(1);
    }

    const blocks = parseContentLines(contentLines);
    const slug = uniqueSlug(start.title, usedSlugs);
    const description = firstParagraph(blocks);
    const searchText = blocksToSearchText(start.title, blocks);

    articles.push({
      slug,
      title: start.title,
      description,
      blocks,
      searchText,
    });
  }

  return { slug: range.slug, name: range.name, articles };
}

function main() {
  const raw = fs.readFileSync(INPUT, "utf8").replace(/\r/g, "");
  const lines = raw.split("\n");
  const ranges = findProductRanges(lines);
  const products = ranges.map((r) => parseProduct(lines, r));

  const linesOut = [];
  linesOut.push('/** Auto-generated by scripts/parse-blazly-docs.mjs — do not edit manually */');
  linesOut.push('import type { DocBlock, DocProduct } from "./types";');
  linesOut.push("");
  linesOut.push("export const DOC_PRODUCTS: DocProduct[] = [");

  for (const product of products) {
    linesOut.push("  {");
    linesOut.push(`    slug: "${product.slug}",`);
    linesOut.push(`    name: "${escapeTs(product.name)}",`);
    linesOut.push("    articles: [");
    for (const article of product.articles) {
      linesOut.push("      {");
      linesOut.push(`        slug: "${article.slug}",`);
      linesOut.push(`        title: "${escapeTs(article.title)}",`);
      linesOut.push(`        description: "${escapeTs(article.description)}",`);
      linesOut.push(`        searchText: "${escapeTs(article.searchText)}",`);
      linesOut.push("        blocks: [");
      for (const block of article.blocks) {
        linesOut.push(serializeBlock(block, 10) + ",");
      }
      linesOut.push("        ],");
      linesOut.push("      },");
    }
    linesOut.push("    ],");
    linesOut.push("  },");
  }

  linesOut.push("];");
  linesOut.push("");

  fs.writeFileSync(OUTPUT, linesOut.join("\n"), "utf8");

  for (const p of products) {
    console.log(`${p.name}: ${p.articles.length} articles`);
    for (const a of p.articles) {
      console.log(`  - ${a.title} (${a.slug})`);
    }
  }
  console.log(`\nWrote ${OUTPUT}`);
}

main();
