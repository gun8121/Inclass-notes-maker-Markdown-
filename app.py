# app.py
# A4 Markdown Writer in Python using Streamlit
# - Portrait or landscape
# - 1–4 columns with quick presets (2-up, 3-up, 4-up)
# - Markdown with code highlighting
# - Math via MathJax ($...$ and $$...$$)
# - Template picker (Lecture Notes, Code Snippets, Formula Sheet, Blank)
# - Printable to A4 using browser print (Save as PDF)
#
# Usage:
#   pip install streamlit
#   streamlit run app.py

import streamlit as st
from streamlit.components.v1 import html as st_html
import base64

st.set_page_config(page_title="A4 Markdown Writer", layout="wide")

# --------------------------
# Presets & Templates
# --------------------------
PRESETS = {
    "2-up": {"columns": 2, "margin_mm": 12, "gap_mm": 10, "font_px": 11, "show_guides": True},
    "3-up": {"columns": 3, "margin_mm": 12, "gap_mm": 8,  "font_px": 10, "show_guides": True},
    "4-up": {"columns": 4, "margin_mm": 10, "gap_mm": 6,  "font_px": 10, "show_guides": True},
}

TEMPLATES = {
    "Blank": "",
    "Lecture Notes": (
        """# Week X — Topic Title

## Key Ideas
- Concept 1
- Concept 2

## Definitions
- **Term**: meaning here

## Example
Let $f(x)=x^2-x$. Then $$f'(x)=2x-1$$

## Quick Derivation
1. Start from ...
2. Apply rule ...

## Takeaways
- Bullet 1
- Bullet 2
"""
    ),
    "Code Snippets": (
        """# Handy Snippets

### Python
```python
from math import sqrt
def mean(xs):
    return sum(xs)/len(xs)
```

### Bash
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### SQL
```sql
SELECT id, AVG(score) AS avg_score
FROM results
GROUP BY id;
```
"""
    ),
    "Formula Sheet": (
        """# Formula Sheet

## Algebra
$ (a+b)^2 = a^2 + 2ab + b^2 $\\
$ (a-b)^2 = a^2 - 2ab + b^2 $\\
$ a^2-b^2=(a-b)(a+b) $

## Calculus
$\dfrac{d}{dx} x^n = nx^{n-1}$\\
$\int_0^1 x^2\,dx = 1/3$

## Trig
$\sin^2 x + \cos^2 x = 1$
"""
    ),
}

# --------------------------
# Sidebar controls
# --------------------------
st.sidebar.title("Page Settings")
cols = st.sidebar.columns(3)
with cols[0]:
    if st.button("2-up"):
        st.session_state.update(PRESETS["2-up"])
with cols[1]:
    if st.button("3-up"):
        st.session_state.update(PRESETS["3-up"])
with cols[2]:
    if st.button("4-up"):
        st.session_state.update(PRESETS["4-up"])

orientation = st.sidebar.selectbox("Orientation", ["portrait", "landscape"], index=0, key="orientation")
columns = st.sidebar.slider("Columns", 1, 4, st.session_state.get("columns", 2), key="columns")
margin_mm = st.sidebar.slider("Page margin (mm)", 5, 25, st.session_state.get("margin_mm", 12), key="margin_mm")
gap_mm = st.sidebar.slider("Column gap (mm)", 4, 20, st.session_state.get("gap_mm", 8), key="gap_mm")
font_px = st.sidebar.slider("Base font (px)", 9, 16, st.session_state.get("font_px", 11), key="font_px")
show_guides = st.sidebar.checkbox("Show column guides", st.session_state.get("show_guides", True), key="show_guides")
show_print_button = st.sidebar.checkbox("Show Print button", True, key="show_print_button")

st.sidebar.markdown("---")
st.sidebar.subheader("Templates")
selected_template = st.sidebar.selectbox("Choose a template", list(TEMPLATES.keys()), index=1)
col_t1, col_t2 = st.sidebar.columns([1,1])
with col_t1:
    load_replace = st.button("Load (replace)")
with col_t2:
    load_append = st.button("Load (append)")

# --------------------------
# Default content & textarea
# --------------------------
default_md = (
    """# A4 Markdown Writer (Python)

Switch orientation, pick columns, then Print → Save as PDF.

---

## Math
Inline: $E=mc^2$  \
Display: $$\int_0^1 x^2\,dx=1/3$$

## Code
```python
import math
print(\"hello\", math.pi)
```

## Lists
- One
- Two
- Three
"""
)

if "md" not in st.session_state:
    st.session_state.md = default_md

if load_replace:
    st.session_state.md = TEMPLATES[selected_template]
elif load_append:
    st.session_state.md += "" + TEMPLATES[selected_template]

md = st.text_area("Markdown", value=st.session_state.md, height=480, key="md")

# --------------------------
# Build printable HTML using client-side renderers
# - marked.js to render Markdown
# - DOMPurify to sanitize
# - MathJax to typeset LaTeX
# - highlight.js for code
# --------------------------
A4_W, A4_H = 210, 297
page_w = A4_W if orientation == "portrait" else A4_H
page_h = A4_H if orientation == "portrait" else A4_W
rule_css = f"column-rule: {'1px solid #ddd' if show_guides else 'none'};"

# Escape for JS template string
md_js = (
    md.replace("\\", r"\\\\")
      .replace("`", r"\`")
      .replace("$", r"\$")
)

html_doc = f"""
<!doctype html>
<html>
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css\"/>
  <script src=\"https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js\"></script>
  <script src=\"https://cdn.jsdelivr.net/npm/dompurify@3.1.7/dist/purify.min.js\"></script>
  <script src=\"https://cdn.jsdelivr.net/npm/marked/marked.min.js\"></script>
  <script>
    window.MathJax = {{ tex: {{ inlineMath: [['$','$'], ['\\(','\\)']] }}, svg: {{fontCache: 'global'}} }};
  </script>
  <script src=\"https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js\"></script>
  <style>
    :root {{
      --page-w-mm: {page_w}mm;
      --page-h-mm: {page_h}mm;
      --margin-mm: {margin_mm}mm;
      --gap-mm: {gap_mm}mm;
      --font-px: {font_px}px;
      --cols: {columns};
    }}
    @page {{ size: A4 {orientation}; margin: var(--margin-mm); }}
    html, body {{ height: 100%; }}
    body {{ background: #f4f5f7; margin: 0; }}
    .toolbar {{ position: sticky; top: 0; background: #fff; border-bottom: 1px solid #e5e7eb; padding: 8px 12px; z-index: 10; font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }}
    .page-shell {{ width: var(--page-w-mm); height: var(--page-h-mm); margin: 24px auto; background: #fff; box-shadow: 0 10px 25px rgba(0,0,0,.08); overflow: hidden; }}
    .page-content {{ box-sizing: border-box; padding: var(--margin-mm); font-size: var(--font-px); line-height: 1.45; column-count: var(--cols); column-gap: var(--gap-mm); {rule_css} font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }}
    .page-content h1, .page-content h2, .page-content h3 {{ break-inside: avoid; }}
    .page-content pre, .page-content code, .page-content img, .page-content table {{ break-inside: avoid; max-width: 100%; }}
    .page-content pre {{ background: #f6f8fa; padding: 10px; border-radius: 6px; overflow: auto; }}
    .page-content code {{ font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }}
    @media print {{ body {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff; }} .toolbar {{ display: none; }} .page-shell {{ box-shadow: none; margin: 0 auto; }} }}
  </style>
</head>
<body>
  <div class=\"toolbar\">A4 preview • {orientation} • {columns} column(s)</div>
  <div class=\"page-shell\"><div id=\"content\" class=\"page-content\"></div></div>
  <script>
    const raw = `{md_js}`;
    const html = DOMPurify.sanitize(marked.parse(raw));
    const container = document.getElementById('content');
    container.innerHTML = html;
    document.querySelectorAll('pre code').forEach(el => window.hljs.highlightElement(el));
    if (window.MathJax && window.MathJax.typeset) {{ window.MathJax.typeset([container]); }}
  </script>
</body>
</html>
"""

st.write("### Live Preview (print from here)")
st_html(html_doc, height=900, scrolling=True)

# --------------------------
# Download as standalone HTML
# --------------------------
if st.button("Download as HTML"):
    b = html_doc.encode("utf-8")
    href = f"data:text/html;base64,{base64.b64encode(b).decode()}"
    st.markdown(f"[Download the HTML file]({href})", unsafe_allow_html=True)

# --------------------------
# Optional: quick print button
# --------------------------
if show_print_button:
    st_html("""
    <div style='text-align:center; margin:10px 0;'>
      <button onclick='window.print()' style='padding:8px 12px; border:1px solid #ddd; border-radius:6px; background:#fff; cursor:pointer;'>Print / Save as PDF</button>
    </div>
    """, height=60)