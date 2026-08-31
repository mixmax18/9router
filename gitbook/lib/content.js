import fs from "fs";
import path from "path";
import { DEFAULT_LANG, isValidLang } from "@/constants/languages";

const CONTENT_ROOT = path.join(process.cwd(), "content");

function readContentFile(lang, slugPath) {
  const resolvedBase = path.resolve(CONTENT_ROOT, lang);
  const resolvedTarget = path.resolve(resolvedBase, `${slugPath}.md`);
  const relative = path.relative(resolvedBase, resolvedTarget);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  if (!fs.existsSync(resolvedTarget)) return null;
  return fs.readFileSync(resolvedTarget, "utf-8");
}

// Load content with fallback to default language if missing
export function loadContent(lang, slug = "index") {
  const safeLang = isValidLang(lang) ? lang : DEFAULT_LANG;
  const slugPath = Array.isArray(slug) ? slug.join("/") : slug;
  return readContentFile(safeLang, slugPath) || readContentFile(DEFAULT_LANG, slugPath);
}

// Walk content/<lang>/ to collect all slugs (excluding index.md)
export function getAllSlugs(lang = DEFAULT_LANG) {
  const resolvedContentRoot = path.resolve(CONTENT_ROOT);
  const resolvedBase = path.resolve(resolvedContentRoot, lang);
  const relativeBase = path.relative(resolvedContentRoot, resolvedBase);
  if (relativeBase.startsWith('..') || path.isAbsolute(relativeBase)) return [];
  if (!fs.existsSync(resolvedBase)) return [];

  const walk = (dir, basePath = "") => {
    const relative = path.relative(resolvedBase, dir);
    if (relative.startsWith('..') || path.isAbsolute(relative)) return [];
    const files = fs.readdirSync(dir);
    let results = [];
    files.forEach(file => {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        results = results.concat(walk(full, path.join(basePath, file)));
      } else if (file.endsWith(".md") && file !== "index.md") {
        const slug = path.join(basePath, file.replace(/\.md$/, ""));
        results.push(slug.split(path.sep));
      }
    });
    return results;
  };

  return walk(resolvedBase);
}
