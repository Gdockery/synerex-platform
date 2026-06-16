"""
Standalone script called by render_pdf() via subprocess.
Runs Playwright outside of eventlet's green-thread context.

Matches the original build_proposal_contract.py / build_network_assessment.py approach:
  - Page 1 (cover): no margins, no header/footer
  - Pages 2+: 1in margins, gray doc-number header (if PROPOSAL_NO env var set),
              centered "Page X of Y" footer
  - The two renders are merged with pypdf.

Usage: python3 render_pdf_worker.py <html_path> <pdf_path> [doc_no]
"""
import sys, os, tempfile

if len(sys.argv) < 3:
    sys.exit("usage: render_pdf_worker.py <html_path> <pdf_path> [doc_no]")

html_path = sys.argv[1]
pdf_path  = sys.argv[2]
doc_no    = sys.argv[3] if len(sys.argv) > 3 else ""

from playwright.sync_api import sync_playwright
from pypdf import PdfWriter, PdfReader

with sync_playwright() as pw:
    browser = pw.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
    page = browser.new_page()
    page.goto(f"file://{html_path}", wait_until="networkidle", timeout=60000)

    # ── Pass 1: cover page only — no margins, no footer ──────────────────────
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as t1:
        tmp_cover = t1.name
    page.pdf(
        path=tmp_cover,
        format="Letter",
        print_background=True,
        margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
        page_ranges="1",
    )

    # ── Pass 2: pages 2+ — margins + "Page X of Y" footer ───────────────────
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as t2:
        tmp_body = t2.name

    header_html = (
        f'<div style="width:100%;text-align:right;font-family:monospace,Arial;'
        f'font-size:8px;color:#aaaaaa;padding:8px 0.6in 0 0;">{doc_no}</div>'
        if doc_no else "<span></span>"
    )
    footer_html = (
        '<div style="width:100%;text-align:center;'
        'font-family:Arial,sans-serif;font-size:9px;'
        'color:#6b7280;padding-bottom:6px;">'
        'Page <span class="pageNumber"></span>'
        ' of <span class="totalPages"></span>'
        "</div>"
    )

    page.pdf(
        path=tmp_body,
        format="Letter",
        print_background=True,
        margin={"top": "0.75in", "right": "0", "bottom": "0.75in", "left": "0"},
        display_header_footer=True,
        header_template=header_html,
        footer_template=footer_html,
        page_ranges="2-",
    )

    browser.close()

# ── Merge: cover (pass 1 p.1) + body (pass 2 all pages) ─────────────────────
writer = PdfWriter()
for tmp in (tmp_cover, tmp_body):
    reader = PdfReader(tmp)
    for p in reader.pages:
        writer.add_page(p)

with open(pdf_path, "wb") as f:
    writer.write(f)

# Clean up temp files
for tmp in (tmp_cover, tmp_body):
    try:
        os.unlink(tmp)
    except OSError:
        pass
