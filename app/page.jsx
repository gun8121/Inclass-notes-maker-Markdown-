"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

// This page uses client-side libs loaded via CDN:
// - marked (Markdown → HTML)
// - DOMPurify (sanitize)
// - highlight.js (code syntax)
// - MathJax v3 (LaTeX math)
// - paged.js (true paginated A4 layout)

const cdn = {
  hljsCss:
    "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css",
  hljsJs:
    "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js",
  marked: "https://cdn.jsdelivr.net/npm/marked/marked.min.js",
  purify: "https://cdn.jsdelivr.net/npm/dompurify@3.1.7/dist/purify.min.js",
  mathjax: "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js",
  pagedjs: "https://unpkg.com/pagedjs/dist/paged.polyfill.js",
};

function useCdnOnce() {
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const addCss = (href) => {
      if (document.querySelector(`link[href="${href}"]`)) return;
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = href;
      document.head.appendChild(l);
    };

    const addJs = (src) =>
      new Promise((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        document.body.appendChild(s);
      });

    // highlight.js CSS
    addCss(cdn.hljsCss);

    (async () => {
      await addJs(cdn.purify);
      await addJs(cdn.marked);
      await addJs(cdn.hljsJs);

      // Configure MathJax before load
      if (!window.MathJax) {
        window.MathJax = {
          tex: { inlineMath: [["$", "$"], ["\\(", "\\)"]] },
          svg: { fontCache: "global" },
        };
      }
      await addJs(cdn.mathjax);
      await addJs(cdn.pagedjs);
    })();
  }, []);
}

function A4MarkdownWriter() {
  useCdnOnce();

  const [orientation, setOrientation] = useState("landscape");
  const [columns, setColumns] = useState(4);
  const [marginMm, setMarginMm] = useState(10);
  const [gapMm, setGapMm] = useState(6);
  const [fontPx, setFontPx] = useState(10);
  const [showGuides, setShowGuides] = useState(true);
  const [maxPagesCap, setMaxPagesCap] = useState(24);
  const [previewPage, setPreviewPage] = useState(1);

  const [md, setMd] = useState(`# A4 Markdown Writer (Next.js)

Switch orientation, pick columns, then print.

---

## Math
Inline: $E=mc^2$  \\\\
Display: $$\\\\int_0^1 x^2\\\\,dx=1/3$$

## Code
\`\`\`python
import math
print("hello", math.pi)
\`\`\`

## Lists
- One
- Two
- Three
`);

  const a4 = useMemo(() => ({ w: 210, h: 297 }), []);
  const pageW = orientation === "portrait" ? a4.w : a4.h;
  const pageH = orientation === "portrait" ? a4.h : a4.w;

  const containerRef = useRef(null);
  const pageCountRef = useRef(0);

  // Rebuild paginated layout whenever inputs change
  useEffect(() => {
    const root = containerRef.current;
    if (!root || !window.marked || !window.DOMPurify) return;

    root.innerHTML = "";

    const html = window.DOMPurify.sanitize(window.marked.parse(md));
    const src = document.createElement("div");
    src.id = "source";
    src.innerHTML = html;
    root.appendChild(src);

    const handleRendered = () => {
      const pages = document.querySelectorAll(".pagedjs_page");
      pageCountRef.current = Math.min(pages.length, maxPagesCap);

      const sel = Math.max(1, Math.min(previewPage, pageCountRef.current));
      pages.forEach((p, i) =>
        p.classList.toggle("is-selected", i + 1 === sel)
      );

      const selected = document.querySelector(".pagedjs_page.is-selected");
      if (selected) {
        selected
          .querySelectorAll("pre code")
          .forEach((el) => window.hljs && window.hljs.highlightElement(el));
        window.MathJax &&
          window.MathJax.typeset &&
          window.MathJax.typeset([selected]);
      }
    };

    document.addEventListener("pagedjs:rendered", handleRendered, {
      once: true,
    });

    if (window.PagedPolyfill) {
      new window.PagedPolyfill(); // triggers pagination
    }

    return () => {
      document.removeEventListener("pagedjs:rendered", handleRendered);
    };
  }, [
    md,
    orientation,
    columns,
    marginMm,
    gapMm,
    fontPx,
    showGuides,
    maxPagesCap,
    previewPage,
  ]);

  const cssVars = `
    :root{
      --page-w-mm:${pageW}mm;
      --page-h-mm:${pageH}mm;
      --margin-mm:${marginMm}mm;
      --gap-mm:${gapMm}mm;
      --font-px:${fontPx}px;
      --cols:${columns}
    }
  `;
  const ruleCss = showGuides
    ? "column-rule: 1px solid #ddd;"
    : "column-rule: none;";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* A4 + columns CSS */}
      <style>{cssVars}</style>
      <style>{`
        @page { size: A4 ${orientation}; margin: var(--margin-mm); }
        html, body { height: 100%; }

        #source {
          box-sizing: border-box;
          font-size: var(--font-px);
          line-height:1.45;
          column-count: var(--cols);
          column-gap: var(--gap-mm);
          ${ruleCss}
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        }
        #source h1, #source h2, #source h3 { break-inside: avoid; }
        #source pre, #source code, #source img, #source table {
          break-inside: avoid;
          max-width:100%;
        }
        #source pre {
          background:#f6f8fa;
          padding:10px;
          border-radius:6px;
          overflow:auto;
        }
        #source code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        }

        .pagedjs_page {
          margin: 16px auto;
          box-shadow: 0 10px 25px rgba(0,0,0,.08);
          background:#fff;
        }

        @media screen {
          .pagedjs_page { display:none; }
          .pagedjs_page.is-selected { display:block; }
        }

        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background:#fff; }
          .no-print { display:none !important; }
          .pagedjs_page { margin:0; box-shadow:none; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium">A4 Markdown Writer (Next.js)</span>

          <div className="flex items-center gap-2">
            <label>Orientation</label>
            <select
              className="border rounded px-2 py-1"
              value={orientation}
              onChange={(e) => setOrientation(e.target.value)}
            >
              <option value="portrait">portrait</option>
              <option value="landscape">landscape</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label>Columns</label>
            <input
              type="number"
              min={1}
              max={4}
              className="w-16 border rounded px-2 py-1"
              value={columns}
              onChange={(e) => setColumns(Number(e.target.value))}
            />
          </div>

          <div className="flex items-center gap-2">
            <label>Margin (mm)</label>
            <input
              type="number"
              min={5}
              max={25}
              className="w-20 border rounded px-2 py-1"
              value={marginMm}
              onChange={(e) => setMarginMm(Number(e.target.value))}
            />
          </div>

          <div className="flex items-center gap-2">
            <label>Gap (mm)</label>
            <input
              type="number"
              min={4}
              max={20}
              className="w-16 border rounded px-2 py-1"
              value={gapMm}
              onChange={(e) => setGapMm(Number(e.target.value))}
            />
          </div>

          <div className="flex items-center gap-2">
            <label>Base font (px)</label>
            <input
              type="number"
              min={9}
              max={16}
              className="w-16 border rounded px-2 py-1"
              value={fontPx}
              onChange={(e) => setFontPx(Number(e.target.value))}
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showGuides}
              onChange={(e) => setShowGuides(e.target.checked)}
            />
            <span>Column guides</span>
          </label>

          <div className="flex items-center gap-2">
            <label>Preview page</label>
            <input
              type="number"
              min={1}
              max={24}
              className="w-16 border rounded px-2 py-1"
              value={previewPage}
              onChange={(e) => setPreviewPage(Number(e.target.value))}
            />
          </div>

          <div className="flex items-center gap-2">
            <label>Max pages</label>
            <input
              type="number"
              min={1}
              max={24}
              className="w-16 border rounded px-2 py-1"
              value={maxPagesCap}
              onChange={(e) => setMaxPagesCap(Number(e.target.value))}
            />
          </div>

          <button
            className="ml-auto border rounded px-3 py-1"
            onClick={() => window.print()}
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-4 p-4">
        <textarea
          className="border rounded p-3 h-[360px] font-mono text-sm"
          value={md}
          onChange={(e) => setMd(e.target.value)}
          placeholder="# Write your markdown here

- Supports $inline$ and $$display$$ math
- Code blocks are highlighted
- Content auto-paginates into A4 pages"
        />
        <div className="text-gray-600 text-sm">
          <p className="mb-2">Tips:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Use fewer columns for dense text; 3–4 for cheat sheets.</li>
            <li>Very large images can push layout around, keep them moderate.</li>
            <li>Use headings to keep column breaks clean.</li>
          </ul>
        </div>
      </div>

      {/* Hidden root: paged.js reads this and creates .pagedjs_page siblings */}
      <div ref={containerRef} className="hidden" />
    </div>
  );
}

export default function Page() {
  return <A4MarkdownWriter />;
}
