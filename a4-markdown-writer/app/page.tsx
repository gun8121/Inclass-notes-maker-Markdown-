"use client";

import React, { useEffect, useMemo, useState } from "react";

const cdn = {
  hljsCss:
    "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css",
  hljsJs:
    "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js",
  marked: "https://cdn.jsdelivr.net/npm/marked/marked.min.js",
  purify: "https://cdn.jsdelivr.net/npm/dompurify@3.1.7/dist/purify.min.js",
  mathjax: "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js",
};

export default function Page() {
  const [orientation, setOrientation] = useState("landscape");
  const [columns, setColumns] = useState(3);
  const [marginMm, setMarginMm] = useState(10);
  const [gapMm, setGapMm] = useState(6);
  const [fontPx, setFontPx] = useState(10);
  const [showGuides, setShowGuides] = useState(true);

  const [md, setMd] = useState(`# A4 Markdown Writer (Next.js)

Switch orientation, pick columns, then print.

---

## Math
Inline: $E=mc^2$  \\\\
Display: $$\\\\int_0^1 x^2\\\\,dx = 1/3$$

## Code
\`\`\`python
import math
print("hello", math.pi)
\`\`\`

## Bullet list
- One
- Two
- Three
`);

  // Just for visual aspect ratio
  const a4 = useMemo(() => ({ w: 210, h: 297 }), []);
  const pageW = orientation === "portrait" ? a4.w : a4.h;
  const pageH = orientation === "portrait" ? a4.h : a4.w;

  // Load client-side libs once
  useEffect(() => {
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

    addCss(cdn.hljsCss);

    (async () => {
      await addJs(cdn.purify);
      await addJs(cdn.marked);
      await addJs(cdn.hljsJs);

      // configure MathJax
      if (!window.MathJax) {
        window.MathJax = {
          tex: { inlineMath: [["$", "$"], ["\\(", "\\)"]] },
          svg: { fontCache: "global" },
        };
      }
      await addJs(cdn.mathjax);
    })();
  }, []);

  // Render markdown into the preview whenever things change
  useEffect(() => {
    const w = window;
    if (!w.marked || !w.DOMPurify) return;

    const container = document.getElementById("a4-content");
    if (!container) return;

    const html = w.DOMPurify.sanitize(w.marked.parse(md));
    container.innerHTML = html;

    // Code highlight
    if (w.hljs) {
      container.querySelectorAll("pre code").forEach((el) =>
        w.hljs.highlightElement(el)
      );
    }

    // Math
    if (w.MathJax && w.MathJax.typeset) {
      w.MathJax.typeset([container]);
    }
  }, [md, orientation, columns, marginMm, gapMm, fontPx, showGuides]);

  const ruleCss = showGuides ? "1px solid #ddd" : "none";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
      }}
    >
      {/* Global print / layout styles */}
      <style>{`
        @page {
          size: A4 ${orientation};
          margin: ${marginMm}mm;
        }

        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: #fff;
          }
          .no-print {
            display: none !important;
          }
        }

        #a4-content {
          box-sizing: border-box;
          font-size: ${fontPx}px;
          line-height: 1.45;
          column-count: ${columns};
          column-gap: ${gapMm}mm;
          column-rule: ${ruleCss};
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        }
        #a4-content h1, #a4-content h2, #a4-content h3 { break-inside: avoid; }
        #a4-content pre, #a4-content code, #a4-content img, #a4-content table {
          break-inside: avoid;
          max-width: 100%;
        }
        #a4-content pre {
          background: #f6f8fa;
          padding: 10px;
          border-radius: 6px;
          overflow: auto;
        }
        #a4-content code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        }
      `}</style>

      {/* Toolbar */}
      <div
        className="no-print"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "white",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "8px 16px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
          }}
        >
          <span style={{ fontWeight: 600 }}>A4 Markdown Writer (Next.js)</span>

          <label>
            Orientation{" "}
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value)}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 4,
                padding: "2px 6px",
              }}
            >
              <option value="portrait">portrait</option>
              <option value="landscape">landscape</option>
            </select>
          </label>

          <label>
            Columns{" "}
            <input
              type="number"
              min={1}
              max={4}
              value={columns}
              onChange={(e) =>
                setColumns(
                  Math.min(4, Math.max(1, Number(e.target.value) || 1))
                )
              }
              style={{
                width: 50,
                border: "1px solid #d1d5db",
                borderRadius: 4,
                padding: "2px 6px",
              }}
            />
          </label>

          <label>
            Margin (mm){" "}
            <input
              type="number"
              min={5}
              max={25}
              value={marginMm}
              onChange={(e) =>
                setMarginMm(
                  Math.min(25, Math.max(5, Number(e.target.value) || 10))
                )
              }
              style={{
                width: 60,
                border: "1px solid #d1d5db",
                borderRadius: 4,
                padding: "2px 6px",
              }}
            />
          </label>

          <label>
            Gap (mm){" "}
            <input
              type="number"
              min={2}
              max={20}
              value={gapMm}
              onChange={(e) =>
                setGapMm(
                  Math.min(20, Math.max(2, Number(e.target.value) || 6))
                )
              }
              style={{
                width: 50,
                border: "1px solid #d1d5db",
                borderRadius: 4,
                padding: "2px 6px",
              }}
            />
          </label>

          <label>
            Font (px){" "}
            <input
              type="number"
              min={9}
              max={16}
              value={fontPx}
              onChange={(e) =>
                setFontPx(
                  Math.min(16, Math.max(9, Number(e.target.value) || 10))
                )
              }
              style={{
                width: 50,
                border: "1px solid #d1d5db",
                borderRadius: 4,
                padding: "2px 6px",
              }}
            />
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input
              type="checkbox"
              checked={showGuides}
              onChange={(e) => setShowGuides(e.target.checked)}
            />
            Column guides
          </label>

          <button
            onClick={handlePrint}
            style={{
              marginLeft: "auto",
              border: "1px solid #d1d5db",
              borderRadius: 4,
              padding: "4px 10px",
              background: "white",
              cursor: "pointer",
            }}
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Editor */}
      <div
        className="no-print"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: 16,
        }}
      >
        <textarea
          value={md}
          onChange={(e) => setMd(e.target.value)}
          style={{
            width: "100%",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            padding: 12,
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 12,
            height: 320,
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Preview BELOW editor */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 16px 24px",
        }}
      >
        <div
          style={{
            width: `${pageW}px`,
            minHeight: `${pageH}px`,
            margin: "0 auto",
            background: "white",
            boxShadow: "0 10px 25px rgba(0,0,0,.08)",
            borderRadius: 6,
            padding: `${marginMm}mm`,
            boxSizing: "border-box",
          }}
        >
          <div id="a4-content" />
        </div>
      </div>
    </div>
  );
}
