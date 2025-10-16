import lume from "lume/mod.ts";
import nunjucks from "lume/plugins/nunjucks.ts";
import codeHighlight from "lume/plugins/code_highlight.ts";
import pagefind from "lume/plugins/pagefind.ts";
import slugifyUrls from "lume/plugins/slugify_urls.ts";

type WikiPage = {
  year: string;
  relPath: string;
  slug: string;
  url: string;
  title: string;
};

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function unslugify(s: string): string {
  const clean = s.replace(/[-_]+/g, " ").trim();
  return clean.replace(/\b\w/g, (m) => m.toUpperCase());
}

async function collectMdPaths(dir: string, base: string, acc: string[] = []): Promise<string[]> {
  try {
    for await (const entry of Deno.readDir(dir)) {
      const p = dir + "/" + entry.name;
      if (entry.isDirectory) {
        await collectMdPaths(p, base, acc);
      } else if (entry.isFile && entry.name.toLowerCase().endsWith(".md")) {
        const rel = p.slice(base.length + 1);
        acc.push(rel);
      }
    }
  } catch {
    // directory may not exist; ignore
  }
  return acc;
}

async function buildWikiIndex(years: string[]): Promise<{ byYear: Record<string, WikiPage[]>; linkBySlug: Record<string, string> }> {
  const byYear: Record<string, WikiPage[]> = {};
  const linkBySlug: Record<string, string> = {};

  for (const year of years) {
    const root = year;
    const relPaths = await collectMdPaths(root, root, []);
    const pages: WikiPage[] = relPaths.map((rel) => {
      const baseName = rel.replace(/\.md$/i, "").split("/").pop() || "index";
      const slug = toSlug(baseName);
      const url = "/" + year + "/" + rel.replace(/\.md$/i, "") + "/";
      const title = unslugify(baseName);
      return { year, relPath: rel, slug, url, title };
    });

    // sort by title for stable nav
    pages.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));

    byYear[year] = pages;

    for (const p of pages) {
      linkBySlug[p.slug] = p.url; // will be overwritten by later years on conflict
    }
  }

  return { byYear, linkBySlug };
}

const site = lume({
  src: ".",
  dest: "_site",
  prettyUrls: true,
  server: {
    port: 3000,
  },
});

// Engines and features
site.use(nunjucks());
site.use(codeHighlight());
site.use(slugifyUrls());

try {
  site.use(pagefind());
} catch (err) {
  console.warn("Pagefind plugin not enabled:", err?.message ?? err);
}

// Copy static assets
site.copy("styles");
site.copy("scripts");
site.copy("fonts");

// Build wiki data and enable [[WikiLinks]] transforms
const years = ["2023", "2024"];
const wikiIndex = await buildWikiIndex(years);

// Expose for templates (sidebar, index)
site.data("wikiPagesByYear", wikiIndex.byYear);

// Transform [[WikiLinks]] in Markdown content to normal links
// and ensure a default wiki layout for Markdown pages if not set
site.preprocess([".md"], (pages) => {
  const pattern = /\[\[([^[\]]+)\]\]/g;
  for (const page of pages) {
    // Default layout for Markdown pages
    if (!page.data.layout) {
      page.data.layout = "layouts/wiki.njk";
    }

    let content = page.data.content;

    if (typeof content === "string") {
      // Normalize unsupported code fence languages to plain text to avoid highlight errors
      content = content.replace(/```(no-highlight|tasks)\b/g, "```text");

      if (pattern.test(content)) {
        content = content.replace(pattern, (_m, g1: string) => {
          const key = toSlug(String(g1).trim());
          const url = wikiIndex.linkBySlug[key];
          if (url) {
            return "[" + g1 + "](" + url + ")";
          }
          return g1;
        });
      }

      page.data.content = content;
    }
  }
});

export default site;
