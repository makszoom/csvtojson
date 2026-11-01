#!/usr/bin/env python3
"""
CSVtoJSON SEO Landing Pages Generator
Generates 5 SEO-optimized landing pages + robots.txt + sitemap.xml
"""

import os
import json

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEO_DIR = os.path.join(PROJECT_DIR, 'seo')

# ═══════ Page definitions ═══════
PAGES = [
    {
        "id": "csv-to-json",
        "filename": "csv-to-json.html",
        "title": "CSV to JSON Converter — Free Online, No Upload | Privacy-First",
        "description": "Convert CSV to JSON online for free. No upload, no registration. Smart type detection, nested mapping, batch processing. $5 lifetime unlimited.",
        "h1": "Convert CSV to JSON<br><span class=\"hero-accent\">Online & Free</span>",
        "subtitle": "Transform your CSV files into clean JSON in seconds. 100% browser-side — your data never leaves your device. No upload, no registration.",
        "keyword": "csv to json converter online free",
        "slug": "csv-to-json",
        "content_h2_1": "What Is a CSV to JSON Converter?",
        "content_p_1": "A CSV to JSON converter transforms Comma-Separated Values (CSV) files into JavaScript Object Notation (JSON) format. CSV is a flat tabular format used by Excel, Google Sheets, and most data export tools. JSON is a structured format used by APIs, web applications, and databases. Converting CSV to JSON makes your data ready for programmatic use, API integration, and nested data structures.",
        "content_h2_2": "Why Convert CSV to JSON?",
        "content_p_2": "JSON is the standard data format for modern web development. APIs expect JSON, databases like MongoDB store JSON, and JavaScript natively parses JSON. CSV requires custom parsing logic and doesn't support nested structures. By converting CSV to JSON, you get structured data that's immediately usable in your applications, scripts, and data pipelines.",
        "content_h2_3": "Who Needs CSV to JSON Conversion?",
        "content_list": [
            "<strong>Developers</strong> — import CSV data into JavaScript apps, REST APIs, or Node.js scripts",
            "<strong>Data analysts</strong> — transform spreadsheet exports into structured JSON for visualization",
            "<strong>Accountants</strong> — convert GST and financial CSV reports into JSON for accounting software",
            "<strong>Marketers</strong> — transform CRM exports into JSON for email platforms and automation tools",
            "<strong>Students</strong> — convert research data from spreadsheets into JSON for projects and assignments",
        ],
        "faq": [
            {"q": "Is CSV to JSON conversion free?", "a": "Yes. You get 5 free conversions with full functionality — no registration, no watermark. For unlimited use, a one-time $5 payment gives you lifetime access."},
            {"q": "Is my data safe when converting CSV to JSON?", "a": "Absolutely. All processing happens in your browser using JavaScript. Your CSV files are never uploaded to any server. Zero network requests after the page loads."},
            {"q": "What CSV formats are supported?", "a": "Comma, semicolon, tab, and pipe delimiters are supported. The tool auto-detects the delimiter, or you can specify it manually. Quoted fields with commas inside are handled correctly."},
            {"q": "Can I convert large CSV files?", "a": "Yes. Files up to 50MB are processed using Web Workers, which run in a separate thread to keep the UI responsive. Progress is shown during conversion."},
            {"q": "Does it work on mobile?", "a": "Yes. The converter works in any mobile browser. Tap to select a CSV file from your device and convert it instantly."},
        ],
    },
    {
        "id": "csv-to-nested-json",
        "filename": "csv-to-nested-json.html",
        "title": "CSV to Nested JSON Online — Dot-Notation Mapping | Free Tool",
        "description": "Convert flat CSV to nested JSON objects using dot-notation. address.city becomes {address: {city: ...}}. No other tool does this. Free, browser-side.",
        "h1": "Convert CSV to<br><span class=\"hero-accent\">Nested JSON</span>",
        "subtitle": "Transform flat CSV columns into deeply nested JSON objects using dot-notation. <code>address.city</code> becomes <code>{\"address\": {\"city\": \"Moscow\"}}</code>. No competitor offers this.",
        "keyword": "csv to nested json online",
        "slug": "csv-to-nested-json",
        "content_h2_1": "What Is Nested JSON?",
        "content_p_1": "Nested JSON means JSON objects that contain other objects or arrays inside them, creating a hierarchical structure. For example, instead of a flat key like <code>address_city</code>, nested JSON uses <code>{\"address\": {\"city\": \"Moscow\"}}</code>. This structure matches how APIs and databases expect data, making integration seamless.",
        "content_h2_2": "How Does Dot-Notation Mapping Work?",
        "content_p_2": "When your CSV has columns with dots in their names (like <code>address.city</code>, <code>address.zip</code>, <code>items.0.title</code>), the converter automatically creates nested objects. You can also manually edit the JSON path for any column in the preview table. Array notation is supported: <code>items.0.title</code> becomes <code>{\"items\": [{\"title\": \"Coffee\"}]}</code>.",
        "content_h2_3": "Why No Other Tool Does This",
        "content_list": [
            "<strong>csvjson.com</strong> — only basic flat conversion, no nested mapping",
            "<strong>convertcsv.com</strong> — paid ($25/6mo), server-side upload required, no nested support",
            "<strong>Python/Node scripts</strong> — support nesting but require programming knowledge",
            "<strong>Our tool</strong> — visual dot-notation mapping, no code needed, 100% browser-side",
        ],
        "faq": [
            {"q": "How do I create nested JSON from CSV?", "a": "Name your CSV columns with dots: 'address.city', 'address.zip', 'items.0.title'. The converter automatically creates nested objects. You can also edit the JSON path for any column in the preview table."},
            {"q": "Can I create arrays in JSON from CSV?", "a": "Yes. Use numeric indices in your column names: 'items.0.title', 'items.0.price', 'items.1.title'. These become array elements: items[0].title, items[1].title."},
            {"q": "What if my CSV columns don't have dots?", "a": "No problem — you get flat JSON by default. You can manually enter dot-notation paths in the JSON Path field under each column in the preview table to create nested structures."},
            {"q": "Can I save my nested mapping for reuse?", "a": "Yes. Click 'Save Mapping' and the tool stores your JSON paths in the browser's localStorage. Load the same CSV file again and click 'Load Mapping' to restore your configuration."},
            {"q": "Is nested JSON conversion free?", "a": "Yes. Nested mapping is included in the free plan (5 conversions). Lifetime unlimited access is $5 one-time payment."},
        ],
    },
    {
        "id": "csv-to-json-batch",
        "filename": "csv-to-json-batch.html",
        "title": "CSV to JSON Batch Converter — Multiple Files at Once | Free",
        "description": "Batch convert multiple CSV files to JSON at once. Download all as ZIP or merge into one JSON array. 100% browser-side, no upload. Free 5 conversions.",
        "h1": "Batch Convert CSV<br><span class=\"hero-accent\">to JSON Files</span>",
        "subtitle": "Drop multiple CSV files and convert them all at once. Download as ZIP with individual JSON files, or merge everything into one JSON array. No upload, no server.",
        "keyword": "csv to json batch converter",
        "slug": "csv-to-json-batch",
        "content_h2_1": "What Is Batch CSV to JSON Conversion?",
        "content_p_1": "Batch conversion means processing multiple CSV files simultaneously, converting each one to JSON without having to repeat the process one file at a time. Instead of converting 50 CSV exports one by one, you drop all 50 files at once and get 50 JSON files in a ZIP archive — or one merged JSON array combining all data.",
        "content_h2_2": "Why Batch Conversion Saves Time",
        "content_p_2": "If you work with monthly reports, data exports, or multi-file datasets, batch conversion eliminates repetitive work. Drop all your CSV files, click Convert, and download a ZIP with all JSON files named after their source CSVs. Or merge all files into a single JSON array for unified processing in your application.",
        "content_h2_3": "Who Needs Batch CSV to JSON?",
        "content_list": [
            "<strong>Data engineers</strong> — convert multiple data exports into JSON for pipeline ingestion",
            "<strong>Accountants</strong> — batch convert monthly GST/financial CSV reports to JSON",
            "<strong>Developers</strong> — transform multiple CSV test fixtures into JSON for test suites",
            "<strong>Marketers</strong> — convert multiple campaign CSV exports into unified JSON",
            "<strong>Researchers</strong> — batch convert survey CSV data into structured JSON for analysis",
        ],
        "faq": [
            {"q": "How many CSV files can I batch convert?", "a": "There's no hard limit. The tool processes files in parallel using Web Workers. For best performance, keep total file size under 100MB across all files."},
            {"q": "Can I download all converted JSON files at once?", "a": "Yes. In batch ZIP mode, all converted JSON files are packaged into a single ZIP archive. Each JSON file is named after its source CSV file."},
            {"q": "Can I merge multiple CSV files into one JSON?", "a": "Yes. Select 'Merge into one JSON' mode and all CSV data is combined into a single JSON array. Each row from every file becomes an element in the array."},
            {"q": "Is batch conversion free?", "a": "You get 5 free batch conversions. Each batch (regardless of file count) counts as one conversion. Lifetime unlimited is $5 one-time."},
            {"q": "Does batch mode work on mobile?", "a": "Yes, but file selection on mobile is limited to the device's file picker. For large batch jobs, desktop is recommended."},
        ],
    },
    {
        "id": "convert-csv-to-json",
        "filename": "convert-csv-to-json.html",
        "title": "Convert CSV to JSON Without Upload — 100% Browser-Side | Free",
        "description": "Convert CSV to JSON without uploading your files. 100% browser-side processing — your data never leaves your device. Private, secure, instant. $5 lifetime.",
        "h1": "Convert CSV to JSON<br><span class=\"hero-accent\">Without Upload</span>",
        "subtitle": "Your data stays on your device. No server upload, no cloud processing, no privacy risk. Everything runs in your browser. The safest CSV to JSON converter.",
        "keyword": "convert csv to json without upload",
        "slug": "convert-csv-to-json",
        "content_h2_1": "Why 'No Upload' Matters",
        "content_p_1": "Most online CSV to JSON converters require you to upload your files to their servers for processing. This means your sensitive data — financial records, customer databases, medical exports — is transmitted over the internet and stored on someone else's server. Even with SSL encryption and promises of deletion, you have no guarantee that your data isn't logged, cached, or accessed by third parties.",
        "content_h2_2": "How Browser-Side Conversion Works",
        "content_p_2": "Our tool uses the <strong>PapaParse</strong> JavaScript library, which runs entirely in your browser. When you drop a CSV file, it's read from your device's memory by JavaScript — no network request is made. The parsing, type detection, and JSON generation all happen locally. The file never leaves your browser tab. You can even disconnect your internet after the page loads and the tool will still work.",
        "content_h2_3": "When Privacy Is Critical",
        "content_list": [
            "<strong>Financial data</strong> — bank statements, transaction exports, accounting records",
            "<strong>Customer databases</strong> — CRM exports with names, emails, phone numbers",
            "<strong>Medical records</strong> — patient data exports from healthcare systems",
            "<strong>Legal documents</strong> — case data, contract metadata, court filings",
            "<strong>Business intelligence</strong> — proprietary sales data, pricing sheets, inventory",
        ],
        "faq": [
            {"q": "Is it really 100% browser-side?", "a": "Yes. The tool loads JavaScript libraries (PapaParse, JSZip, highlight.js) from CDN on page load. After that, all processing is local. You can verify this in your browser's Network tab — no requests are made when converting files."},
            {"q": "Can I use it offline?", "a": "After the page loads for the first time, the tool works without internet. The only network request after page load is the payment verification (only when you choose to buy the lifetime license)."},
            {"q": "Is browser-side processing slower?", "a": "No. For files under 10MB, browser-side parsing is often faster than upload-and-process because there's no network transfer time. Web Workers handle large files without freezing the UI."},
            {"q": "What about file size limits?", "a": "Files up to 50MB work smoothly. Browser memory is the only constraint — there's no server-imposed limit like with upload-based tools."},
            {"q": "Does no-upload mean no tracking?", "a": "Correct. We don't use Google Analytics, tracking pixels, or any third-party analytics. The only external request is the payment Worker (Cloudflare), and only when you initiate a payment."},
        ],
    },
    {
        "id": "csv-to-json-for-gst",
        "filename": "csv-to-json-for-gst.html",
        "title": "CSV to JSON for GST Returns — GSTR1/GSTR3B Converter | Free Online",
        "description": "Convert GST CSV reports (GSTR1, GSTR3B) to JSON format for accounting software and APIs. Browser-side, no upload. Batch process monthly returns. $5 lifetime.",
        "h1": "Convert GST CSV<br><span class=\"hero-accent\">to JSON Format</span>",
        "subtitle": "Transform your GSTR1, GSTR3B, and other GST CSV exports into structured JSON for accounting software, API submission, and automated tax workflows. Monthly batch processing.",
        "keyword": "csv to json for gst",
        "slug": "csv-to-json-for-gst",
        "content_h2_1": "Why Convert GST CSV to JSON?",
        "content_p_1": "The Goods and Services Tax (GST) system in India requires businesses to file regular returns (GSTR1, GSTR3B, GSTR2A). Many accounting tools and GST APIs accept JSON format for data submission. If your GST software exports data as CSV (which most do), you need to convert it to JSON before submitting to the GST portal or feeding it into automated tax workflows.",
        "content_h2_2": "How Batch Processing Helps with Monthly Returns",
        "content_p_2": "GST returns are filed monthly. If you handle multiple clients or business units, you may have dozens of CSV files each month. Batch mode lets you drop all monthly CSV exports at once and either download individual JSON files as a ZIP, or merge all data into one JSON array for consolidated reporting. This turns a repetitive monthly task into a one-click workflow.",
        "content_h2_3": "GST CSV to JSON Use Cases",
        "content_list": [
            "<strong>GSTR1 filing</strong> — convert outward supplies CSV to JSON for GST portal API",
            "<strong>GSTR3B filing</strong> — transform summary returns CSV to JSON for automated submission",
            "<strong>Multi-client accounting</strong> — batch convert multiple client CSVs in one operation",
            "<strong>Reconciliation</strong> — convert GSTR2A purchase data CSV to JSON for matching with books",
            "<strong>Audit preparation</strong> — transform annual GST data exports into structured JSON for analysis",
        ],
        "faq": [
            {"q": "Can I convert GSTR1 CSV to JSON?", "a": "Yes. Upload your GSTR1 CSV export and the tool converts it to structured JSON. You can use nested mapping to create the exact JSON structure your GST API expects."},
            {"q": "Does it support GSTR3B format?", "a": "Yes. Any CSV file can be converted — the tool doesn't discriminate by content. GSTR3B summary CSVs are converted to JSON just like any other CSV."},
            {"q": "Can I batch convert multiple months?", "a": "Yes. Drop all monthly CSV files at once, select batch mode, and download all JSON files as a ZIP. Or merge all months into one consolidated JSON array."},
            {"q": "Is my GST data safe?", "a": "Yes. All processing is 100% browser-side. Your GST data never leaves your device — no upload, no server, no cloud. This is especially important for sensitive financial and tax data."},
            {"q": "How much does it cost?", "a": "5 free conversions (each batch counts as one). For monthly GST filing, the $5 lifetime license pays for itself immediately — unlimited conversions forever, no subscription."},
        ],
    },
]

# ═══════ Related links generator ═══════
def generate_related_links(current_id):
    links = []
    for page in PAGES:
        if page['id'] != current_id:
            links.append(
                f'<a href="{page["filename"]}" class="related-card">'
                f'<span class="related-icon">📄</span>'
                f'<span class="related-title">{page["keyword"].title()}</span>'
                f'</a>'
            )
    return '\n'.join(links)

# ═══════ HTML template ═══════
def generate_page(page):
    related_links = generate_related_links(page['id'])

    # Schema.org FAQPage
    faq_entities = []
    for item in page['faq']:
        faq_entities.append(
            f'{{"@type":"Question","name":"{item["q"]}","acceptedAnswer":'
            f'{{"@type":"Answer","text":"{item["a"]}"}}}}'
        )
    faq_json = json.dumps({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in [(f["q"], f["a"]) for f in page["faq"]]]
    }, indent=4)

    # Schema.org HowTo
    howto_json = json.dumps({
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": f"How to {page['keyword']}",
        "description": page['description'],
        "totalTime": "PT1M",
        "step": [
            {"@type": "HowToStep", "position": 1, "name": "Upload CSV", "text": "Drag and drop your CSV file or click to browse."},
            {"@type": "HowToStep", "position": 2, "name": "Configure", "text": "Set delimiter, header row, type detection, and nested mapping options."},
            {"@type": "HowToStep", "position": 3, "name": "Convert & Download", "text": "Click Convert to JSON and download or copy the result."}
        ]
    }, indent=4)

    # FAQ HTML
    faq_html = ""
    for item in page['faq']:
        faq_html += f'<details class="faq-item"><summary>{item["q"]}</summary><p>{item["a"]}</p></details>\n'

    # Content list HTML
    content_list_html = ""
    for item in page['content_list']:
        content_list_html += f'<li>{item}</li>\n'

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{page["title"]}</title>
    <meta name="description" content="{page["description"]}">
    <link rel="canonical" href="https://csvtojson.app/{page["slug"]}">
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E📋%3C/text%3E%3C/svg%3E">
    <link rel="stylesheet" href="css/style.css">

    <!-- Open Graph -->
    <meta property="og:title" content="{page["title"]}">
    <meta property="og:description" content="{page["description"]}">
    <meta property="og:url" content="https://csvtojson.app/{page["slug"]}">
    <meta property="og:type" content="website">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{page["title"]}">
    <meta name="twitter:description" content="{page["description"]}">

    <!-- Schema.org HowTo -->
    <script type="application/ld+json">
{howto_json}
    </script>

    <!-- Schema.org FAQPage -->
    <script type="application/ld+json">
{faq_json}
    </script>
</head>
<body>
    <header class="header">
        <div class="container header-inner">
            <a href="index.html" class="logo">
                <span class="logo-icon">📋</span>
                <span class="logo-text">CSV<span class="logo-accent">→</span>JSON</span>
            </a>
            <div class="header-badges">
                <span class="badge badge-free">Free</span>
                <span class="badge badge-privacy">No Upload</span>
            </div>
        </div>
    </header>

    <section class="hero">
        <div class="container">
            <h1>{page["h1"]}</h1>
            <p class="hero-subtitle">{page["subtitle"]}</p>
            <a href="index.html" class="btn-primary" style="display:inline-block;width:auto;padding:14px 32px;text-decoration:none;margin-top:24px;">Open CSV to JSON Converter</a>
        </div>
    </section>

    <main class="container seo-content">
        <h2>{page["content_h2_1"]}</h2>
        <p>{page["content_p_1"]}</p>

        <h2>{page["content_h2_2"]}</h2>
        <p>{page["content_p_2"]}</p>

        <h2>{page["content_h2_3"]}</h2>
        <ul class="seo-list">
{content_list_html}
        </ul>

        <h2>How to {page["keyword"]} (3 Steps)</h2>
        <ol class="seo-steps">
            <li><strong>Upload your CSV file</strong> — drag and drop or tap to select from your device</li>
            <li><strong>Configure options</strong> — set delimiter, header row, type detection, and nested mapping</li>
            <li><strong>Convert and download</strong> — click Convert, then copy or download your JSON file</li>
        </ol>

        <div style="text-align:center;margin:40px 0;">
            <a href="index.html" class="btn-primary" style="display:inline-block;width:auto;padding:16px 32px;text-decoration:none;">Try CSV to JSON Converter</a>
        </div>
    </main>

    <section class="faq-section">
        <div class="container">
            <h2 class="section-title-center">Frequently Asked Questions</h2>
            <div class="faq-list" style="max-width:680px;margin:0 auto;">
{faq_html}
            </div>
        </div>
    </section>

    <section class="features-section">
        <div class="container">
            <h2 class="section-title-center">Related Tools</h2>
            <div class="related-grid">
{related_links}
            </div>
        </div>
    </section>

    <footer class="footer">
        <div class="container">
            <p class="footer-text">CSV→JSON Converter · Browser-Side · Privacy-First · <a href="index.html">Home</a></p>
        </div>
    </footer>

    <script src="js/app.js"></script>
</body>
</html>'''
    return html


# ═══════ Generate all pages ═══════
os.makedirs(SEO_DIR, exist_ok=True)

for page in PAGES:
    html = generate_page(page)
    filepath = os.path.join(SEO_DIR, page['filename'])
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"✅ Generated: {page['filename']} ({len(html)} bytes)")

# ═══════ Generate robots.txt ═══════
robots_content = """User-agent: *
Allow: /

Sitemap: https://csvtojson.app/sitemap.xml
"""
robots_path = os.path.join(PROJECT_DIR, 'robots.txt')
with open(robots_path, 'w', encoding='utf-8') as f:
    f.write(robots_content)
print(f"✅ Generated: robots.txt")

# ═══════ Generate sitemap.xml ═══════
from datetime import datetime
today = datetime.now().strftime('%Y-%m-%d')

sitemap_urls = [
    ("https://csvtojson.app/", "1.0", today, "monthly"),
]
for page in PAGES:
    sitemap_urls.append((f"https://csvtojson.app/{page['slug']}", "0.8", today, "monthly"))

sitemap_xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
sitemap_xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
for url, priority, lastmod, changefreq in sitemap_urls:
    sitemap_xml += f'  <url>\n'
    sitemap_xml += f'    <loc>{url}</loc>\n'
    sitemap_xml += f'    <lastmod>{lastmod}</lastmod>\n'
    sitemap_xml += f'    <changefreq>{changefreq}</changefreq>\n'
    sitemap_xml += f'    <priority>{priority}</priority>\n'
    sitemap_xml += f'  </url>\n'
sitemap_xml += '</urlset>\n'

sitemap_path = os.path.join(PROJECT_DIR, 'sitemap.xml')
with open(sitemap_path, 'w', encoding='utf-8') as f:
    f.write(sitemap_xml)
print(f"✅ Generated: sitemap.xml ({len(sitemap_urls)} URLs)")

print(f"\n📊 Total: {len(PAGES)} landing pages + robots.txt + sitemap.xml")
print(f"📁 Output: {SEO_DIR}")