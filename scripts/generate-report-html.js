/**
 * WanderLust Report — Word-Compatible HTML Generator
 * Reads all 4 markdown parts and produces one HTML file openable in MS Word / Google Docs
 * Run: node scripts/generate-report-html.js
 */

const fs = require('fs');
const path = require('path');

const PARTS = [
    'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\d0e36769-a749-4104-92b7-c5b141dcd3ed\\report_part1.md',
    'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\d0e36769-a749-4104-92b7-c5b141dcd3ed\\report_part2.md',
    'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\d0e36769-a749-4104-92b7-c5b141dcd3ed\\report_part3.md',
    'C:\\Users\\Asus\\.gemini\\antigravity\\brain\\d0e36769-a749-4104-92b7-c5b141dcd3ed\\report_part4.md',
];

const OUTPUT = path.join(__dirname, '..', 'WanderLust_Project_Report.html');

// ── Markdown → HTML converter ───────────────────────────────────────────────

function mdToHtml(md) {
    const lines = md.split('\n');
    let html = '';
    let i = 0;
    let inList = false;
    let inNumbered = false;

    function closeList() {
        if (inList) { html += '</ul>\n'; inList = false; }
        if (inNumbered) { html += '</ol>\n'; inNumbered = false; }
    }

    function inlineFormat(text) {
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
            .replace(/\[(.+?)\]\(.+?\)/g, '$1');
    }

    while (i < lines.length) {
        const line = lines[i];

        // Code block
        if (/^```/.test(line)) {
            closeList();
            const codeLines = [];
            i++;
            while (i < lines.length && !/^```/.test(lines[i])) {
                codeLines.push(lines[i].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
                i++;
            }
            html += `<pre><code>${codeLines.join('\n')}</code></pre>\n`;
            i++;
            continue;
        }

        // Table
        if (/^\|/.test(line)) {
            closeList();
            html += '<table>\n';
            let firstRow = true;
            while (i < lines.length && /^\|/.test(lines[i])) {
                if (/^[|\s\-:]+$/.test(lines[i])) { i++; continue; }
                const cells = lines[i].split('|').map(c => c.trim()).filter(c => c !== '');
                const tag = firstRow ? 'th' : 'td';
                html += '<tr>' + cells.map(c => `<${tag}>${inlineFormat(c)}</${tag}>`).join('') + '</tr>\n';
                firstRow = false;
                i++;
            }
            html += '</table>\n';
            continue;
        }

        // H1
        if (/^# /.test(line)) {
            closeList();
            html += `<h1>${inlineFormat(line.replace(/^# /, ''))}</h1>\n`;
            i++; continue;
        }
        // H2
        if (/^## /.test(line)) {
            closeList();
            html += `<h2>${inlineFormat(line.replace(/^## /, ''))}</h2>\n`;
            i++; continue;
        }
        // H3
        if (/^### /.test(line)) {
            closeList();
            html += `<h3>${inlineFormat(line.replace(/^### /, ''))}</h3>\n`;
            i++; continue;
        }
        // H4
        if (/^#### /.test(line)) {
            closeList();
            html += `<h4>${inlineFormat(line.replace(/^#### /, ''))}</h4>\n`;
            i++; continue;
        }

        // HR
        if (/^---/.test(line)) {
            closeList();
            html += '<hr>\n';
            i++; continue;
        }

        // Bullet
        if (/^[\-\*] /.test(line)) {
            if (!inList) { html += '<ul>\n'; inList = true; }
            html += `<li>${inlineFormat(line.replace(/^[\-\*] /, ''))}</li>\n`;
            i++; continue;
        }

        // Numbered list
        if (/^\d+\. /.test(line)) {
            if (!inNumbered) { html += '<ol>\n'; inNumbered = true; }
            html += `<li>${inlineFormat(line.replace(/^\d+\. /, ''))}</li>\n`;
            i++; continue;
        }

        // Blank line
        if (line.trim() === '') {
            closeList();
            html += '<p></p>\n';
            i++; continue;
        }

        // Paragraph
        closeList();
        html += `<p>${inlineFormat(line)}</p>\n`;
        i++;
    }

    closeList();
    return html;
}

// ── Build combined HTML ──────────────────────────────────────────────────────

function buildHtml(bodyContent) {
    return `<!DOCTYPE html>
<html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
<title>WanderLust Project Report 2025-26</title>
<!--[if gte mso 9]>
<xml>
  <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
  </w:WordDocument>
</xml>
<![endif]-->
<style>
  /* ── Page Setup (Word + Print) ── */
  @page {
    size: A4;
    margin: 2.5cm 2.5cm 2.5cm 3cm;
  }
  @page :first { margin-top: 3cm; }

  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #000;
    background: #fff;
    max-width: 21cm;
    margin: 0 auto;
    padding: 1cm 1.5cm;
  }

  /* ── Headings ── */
  h1 {
    font-size: 16pt;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 28pt 0 10pt 0;
    page-break-before: always;
    border-bottom: 2px solid #000;
    padding-bottom: 6pt;
  }
  h1:first-of-type { page-break-before: avoid; }

  h2 {
    font-size: 13pt;
    font-weight: bold;
    margin: 18pt 0 6pt 0;
    border-bottom: 1px solid #555;
    padding-bottom: 2pt;
  }

  h3 { font-size: 12pt; font-weight: bold; margin: 14pt 0 4pt 0; }
  h4 { font-size: 11pt; font-weight: bold; font-style: italic; margin: 10pt 0 4pt 0; }

  /* ── Body text ── */
  p {
    text-align: justify;
    margin: 4pt 0;
    orphans: 3;
    widows: 3;
  }

  /* ── Lists ── */
  ul, ol {
    margin: 6pt 0 6pt 20pt;
    padding: 0;
  }
  li { margin-bottom: 3pt; text-align: justify; }

  /* ── Tables ── */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12pt 0;
    font-size: 10pt;
    page-break-inside: avoid;
  }
  th {
    background-color: #1a3a5c;
    color: #fff;
    font-weight: bold;
    padding: 6pt 8pt;
    border: 1px solid #555;
    text-align: center;
  }
  td {
    padding: 5pt 8pt;
    border: 1px solid #aaa;
    vertical-align: top;
  }
  tr:nth-child(even) td { background-color: #f0f4f8; }

  /* ── Code blocks ── */
  pre {
    background: #f3f4f6;
    border: 1px solid #ccc;
    border-left: 4px solid #2563eb;
    padding: 8pt 10pt;
    font-family: "Courier New", monospace;
    font-size: 9pt;
    line-height: 1.4;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 8pt 0;
    page-break-inside: avoid;
  }
  code {
    font-family: "Courier New", monospace;
    font-size: 9.5pt;
    background: #f0f0f0;
    padding: 0 2pt;
  }

  /* ── Horizontal rule ── */
  hr {
    border: none;
    border-top: 1px solid #999;
    margin: 14pt 0;
  }

  /* ── Cover Page ── */
  .cover-page {
    text-align: center;
    page-break-after: always;
    padding: 40pt 20pt;
  }
  .cover-page h1 {
    font-size: 28pt;
    border: none;
    page-break-before: avoid;
    margin-bottom: 4pt;
  }
  .cover-page .subtitle {
    font-size: 14pt;
    font-style: italic;
    color: #333;
    margin-bottom: 30pt;
  }
  .cover-page .divider {
    border-top: 3px solid #1a3a5c;
    margin: 16pt 40pt;
  }
  .cover-page table {
    margin: 0 auto;
    width: auto;
    min-width: 60%;
  }
  .cover-page th, .cover-page td {
    background: transparent;
    color: #000;
    text-align: center;
    border: 1px solid #999;
  }

  /* ── Print rules ── */
  @media print {
    body { padding: 0; }
    h1 { page-break-before: always; }
    pre, table, figure { page-break-inside: avoid; }
    h2, h3, h4 { page-break-after: avoid; }
  }
</style>
</head>
<body>

<!-- ══════════ COVER PAGE ══════════ -->
<div class="cover-page">
  <p style="font-size:11pt; margin-bottom:8pt;">[College Name] | [University Name]</p>
  <p style="font-size:10pt; margin-bottom:40pt;">Department of Computer Engineering</p>

  <h1>WANDERLUST</h1>
  <p class="subtitle">A Full-Stack AI-Powered Travel &amp; Hospitality Booking Platform</p>
  <div class="divider"></div>

  <p style="font-size:11pt; margin: 16pt 0 6pt 0;">A Project Report submitted in partial fulfillment<br>
  of the requirements for the Degree of<br>
  <strong>Bachelor of Engineering in Computer Engineering</strong></p>

  <div class="divider"></div>

  <p style="margin-top:20pt;"><strong>Submitted By:</strong></p>
  <table style="margin:8pt auto; width:60%;">
    <tr><th>Roll No.</th><th>Name</th></tr>
    <tr><td>[Roll No.]</td><td>Narendra Bhute</td></tr>
    <tr><td>[Roll No.]</td><td>[Team Member 2]</td></tr>
    <tr><td>[Roll No.]</td><td>[Team Member 3]</td></tr>
    <tr><td>[Roll No.]</td><td>[Team Member 4]</td></tr>
  </table>

  <p style="margin-top:20pt;"><strong>Under the Guidance of:</strong><br>
  Prof. [Guide Name]<br>
  [Department], [College Name]</p>

  <div class="divider"></div>
  <p style="margin-top:16pt; font-size:11pt;"><strong>Academic Year: 2025–2026</strong></p>
</div>

<!-- ══════════ REPORT BODY ══════════ -->
${bodyContent}

</body>
</html>`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

console.log('📄 Reading report parts...');
let combined = '';

for (const partPath of PARTS) {
    if (!fs.existsSync(partPath)) {
        console.warn(`⚠️  Skipping missing file: ${partPath}`);
        continue;
    }
    const md = fs.readFileSync(partPath, 'utf8');
    console.log(`   ✓ Loaded: ${path.basename(partPath)}`);
    combined += md + '\n\n';
}

console.log('🔄 Converting Markdown → HTML...');
const bodyHtml = mdToHtml(combined);

console.log('💾 Writing output file...');
const fullHtml = buildHtml(bodyHtml);
fs.writeFileSync(OUTPUT, fullHtml, 'utf8');

const sizeKB = Math.round(fs.statSync(OUTPUT).size / 1024);
console.log(`\n✅ Done!`);
console.log(`📁 File: ${OUTPUT}`);
console.log(`📦 Size: ${sizeKB} KB`);
console.log(`\n👉 HOW TO USE:`);
console.log(`   1. Double-click "WanderLust_Project_Report.html" to open in Word`);
console.log(`   2. Word will ask to convert — click YES`);
console.log(`   3. File > Save As > .docx`);
console.log(`   4. File > Export > PDF`);
