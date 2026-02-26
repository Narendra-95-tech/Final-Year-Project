/**
 * WanderLust Project Report PDF Generator
 * Generates full final year project report as PDF using pdfkit
 * Run: node scripts/generate-report-pdf.js
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, '..', 'WanderLust_Project_Report.pdf');
const PARTS = [
    path.join('C:\\Users\\Asus\\.gemini\\antigravity\\brain\\d0e36769-a749-4104-92b7-c5b141dcd3ed', 'report_part1.md'),
    path.join('C:\\Users\\Asus\\.gemini\\antigravity\\brain\\d0e36769-a749-4104-92b7-c5b141dcd3ed', 'report_part2.md'),
    path.join('C:\\Users\\Asus\\.gemini\\antigravity\\brain\\d0e36769-a749-4104-92b7-c5b141dcd3ed', 'report_part3.md'),
    path.join('C:\\Users\\Asus\\.gemini\\antigravity\\brain\\d0e36769-a749-4104-92b7-c5b141dcd3ed', 'report_part4.md'),
];

// --- Color definitions ---
const COLORS = {
    black: '#000000',
    darkBlue: '#1a3a5c',
    mediumBlue: '#2563eb',
    gray: '#4b5563',
    lightGray: '#9ca3af',
    tableBorder: '#d1d5db',
    tableHeader: '#1e3a5f',
    tableHeaderText: '#ffffff',
    tableRow1: '#f0f4f8',
    tableRow2: '#ffffff',
    codeBackground: '#f3f4f6',
    codeBorder: '#d1d5db',
    accent: '#16a34a',
};

// --- Font sizes ---
const SIZE = {
    h1: 24,
    h2: 17,
    h3: 13,
    h4: 11,
    body: 10,
    small: 9,
    code: 8.5,
};

const MARGIN = { top: 72, left: 72, right: 72, bottom: 72 };

// -----------------------------------------------
// Utility: Parse a markdown file into "tokens"
// -----------------------------------------------
function parseMarkdown(text) {
    const tokens = [];
    const lines = text.split('\n');
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Chapter heading (H1)
        if (/^# (.+)/.test(line)) {
            tokens.push({ type: 'h1', text: line.replace(/^# /, '') });
            i++;
            continue;
        }

        // H2
        if (/^## (.+)/.test(line)) {
            tokens.push({ type: 'h2', text: line.replace(/^## /, '') });
            i++;
            continue;
        }

        // H3
        if (/^### (.+)/.test(line)) {
            tokens.push({ type: 'h3', text: line.replace(/^### /, '') });
            i++;
            continue;
        }

        // H4
        if (/^#### (.+)/.test(line)) {
            tokens.push({ type: 'h4', text: line.replace(/^#### /, '') });
            i++;
            continue;
        }

        // Horizontal rule
        if (/^---/.test(line)) {
            tokens.push({ type: 'hr' });
            i++;
            continue;
        }

        // Code block
        if (/^```/.test(line)) {
            const codeLines = [];
            i++;
            while (i < lines.length && !/^```/.test(lines[i])) {
                codeLines.push(lines[i]);
                i++;
            }
            i++; // skip closing ```
            tokens.push({ type: 'code', text: codeLines.join('\n') });
            continue;
        }

        // Table row
        if (/^\|/.test(line)) {
            // Collect all table rows
            const tableRows = [];
            while (i < lines.length && /^\|/.test(lines[i])) {
                // Skip separator rows like |---|---|
                if (!/^\|[\s\-|]+\|/.test(lines[i]) || /[a-zA-Z0-9]/.test(lines[i])) {
                    if (!/^[|\s\-:]+$/.test(lines[i])) {
                        const cells = lines[i].split('|').map(c => c.trim()).filter(c => c !== '');
                        tableRows.push(cells);
                    }
                }
                i++;
            }
            if (tableRows.length > 0) {
                tokens.push({ type: 'table', rows: tableRows });
            }
            continue;
        }

        // Bullet / list item
        if (/^[\-\*] (.+)/.test(line)) {
            tokens.push({ type: 'bullet', text: line.replace(/^[\-\*] /, '') });
            i++;
            continue;
        }

        // Numbered list
        if (/^\d+\. (.+)/.test(line)) {
            tokens.push({ type: 'numbered', text: line.replace(/^\d+\. /, ''), num: line.match(/^(\d+)/)[1] });
            i++;
            continue;
        }

        // Empty line
        if (line.trim() === '') {
            tokens.push({ type: 'blank' });
            i++;
            continue;
        }

        // Regular paragraph
        tokens.push({ type: 'para', text: line });
        i++;
    }

    return tokens;
}

// -----------------------------------------------
// Clean markdown formatting from text
// -----------------------------------------------
function cleanText(text) {
    if (!text) return '';
    return text
        .replace(/\*\*(.+?)\*\*/g, '$1')    // bold
        .replace(/\*(.+?)\*/g, '$1')         // italic
        .replace(/`(.+?)`/g, '$1')           // inline code
        .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links
        .replace(/#+\s/g, '')                // headers
        .replace(/\|/g, ' | ')
        .trim();
}

// -----------------------------------------------
// Main PDF generation
// -----------------------------------------------
function generatePDF() {
    console.log('📄 Generating WanderLust Project Report PDF...');

    const doc = new PDFDocument({
        size: 'A4',
        margins: { top: MARGIN.top, left: MARGIN.left, right: MARGIN.right, bottom: MARGIN.bottom },
        info: {
            Title: 'WanderLust - Final Year Project Report',
            Author: 'Narendra Bhute',
            Subject: 'Full-Stack AI-Powered Travel & Hospitality Booking Platform',
            Keywords: 'NodeJS, MongoDB, AI, PWA, Booking, Travel',
        },
        autoFirstPage: false,
    });

    const stream = fs.createWriteStream(OUTPUT_PATH);
    doc.pipe(stream);

    // ---- COVER PAGE ----
    doc.addPage();
    doc.rect(0, 0, doc.page.width, 10).fill(COLORS.darkBlue);
    doc.rect(0, doc.page.height - 10, doc.page.width, 10).fill(COLORS.darkBlue);

    doc.moveDown(4);
    doc.fontSize(28).fillColor(COLORS.darkBlue).font('Helvetica-Bold')
        .text('WANDERLUST', { align: 'center' });

    doc.fontSize(13).fillColor(COLORS.gray).font('Helvetica')
        .text('A Full-Stack AI-Powered Travel & Hospitality Booking Platform', {
            align: 'center',
        });

    doc.moveDown(1);
    doc.moveTo(MARGIN.left, doc.y).lineTo(doc.page.width - MARGIN.right, doc.y)
        .strokeColor(COLORS.mediumBlue).lineWidth(1.5).stroke();

    doc.moveDown(1.5);
    doc.fontSize(10.5).fillColor(COLORS.gray)
        .text('A Project Report submitted in partial fulfillment of the requirements', { align: 'center' })
        .text('for the Degree of Bachelor of Engineering in Computer Engineering', { align: 'center' });

    doc.moveDown(2);
    doc.fontSize(11).fillColor(COLORS.black).font('Helvetica-Bold')
        .text('Submitted by:', { align: 'center' });
    doc.font('Helvetica').fontSize(10.5)
        .text('Narendra Bhute  |  [Team Member 2]  |  [Team Member 3]  |  [Team Member 4]', { align: 'center' });

    doc.moveDown(1.5);
    doc.font('Helvetica-Bold').text('Under the Guidance of:', { align: 'center' });
    doc.font('Helvetica').text('Prof. [Guide Name], Department of Computer Engineering', { align: 'center' });

    doc.moveDown(2);
    doc.font('Helvetica-Bold').text('Department of Computer Engineering', { align: 'center' });
    doc.font('Helvetica').text('[College Name], [University Name]', { align: 'center' });
    doc.text('Academic Year: 2025–2026', { align: 'center' });

    doc.moveDown(3);
    doc.rect(MARGIN.left, doc.y, doc.page.width - MARGIN.left - MARGIN.right, 4)
        .fill(COLORS.darkBlue);

    // ---- CONTENT PAGES ----
    let pageNum = 1;
    let blankCount = 0;

    // Add header/footer to each page
    const addHeaderFooter = (pageIndex) => {
        const oldY = doc.y;
        // Header
        doc.font('Helvetica').fontSize(8).fillColor(COLORS.lightGray)
            .text('WanderLust — Final Year Project Report', MARGIN.left, 30, {
                align: 'left', width: doc.page.width - MARGIN.left - MARGIN.right
            });
        doc.moveTo(MARGIN.left, 44).lineTo(doc.page.width - MARGIN.right, 44)
            .strokeColor(COLORS.tableBorder).lineWidth(0.5).stroke();

        // Footer
        doc.moveTo(MARGIN.left, doc.page.height - 50)
            .lineTo(doc.page.width - MARGIN.right, doc.page.height - 50)
            .strokeColor(COLORS.tableBorder).lineWidth(0.5).stroke();
        doc.text(`Page ${pageIndex}`, MARGIN.left, doc.page.height - 42, {
            align: 'center', width: doc.page.width - MARGIN.left - MARGIN.right
        });
        doc.y = oldY;
    };

    doc.on('pageAdded', () => {
        addHeaderFooter(++pageNum);
    });

    const pageWidth = doc.page.width - MARGIN.left - MARGIN.right;

    // Process each markdown part
    for (const partPath of PARTS) {
        if (!fs.existsSync(partPath)) {
            console.warn(`⚠️  File not found: ${partPath}`);
            continue;
        }

        const content = fs.readFileSync(partPath, 'utf8');
        const tokens = parseMarkdown(content);

        for (const token of tokens) {
            // Check remaining space
            const remainingY = doc.page.height - MARGIN.bottom - doc.y;

            switch (token.type) {

                case 'h1': {
                    if (remainingY < 80) doc.addPage();
                    else doc.moveDown(1.5);
                    doc.rect(MARGIN.left - 5, doc.y - 2, pageWidth + 10, SIZE.h1 + 14)
                        .fill(COLORS.darkBlue);
                    doc.font('Helvetica-Bold').fontSize(SIZE.h1)
                        .fillColor('#ffffff')
                        .text(cleanText(token.text), MARGIN.left, doc.y - SIZE.h1 - 8, {
                            width: pageWidth, lineBreak: true
                        });
                    doc.moveDown(0.8);
                    blankCount = 0;
                    break;
                }

                case 'h2': {
                    if (remainingY < 60) doc.addPage();
                    else doc.moveDown(1.2);
                    doc.font('Helvetica-Bold').fontSize(SIZE.h2).fillColor(COLORS.darkBlue)
                        .text(cleanText(token.text), { width: pageWidth });
                    doc.moveTo(MARGIN.left, doc.y).lineTo(MARGIN.left + pageWidth, doc.y)
                        .strokeColor(COLORS.mediumBlue).lineWidth(1).stroke();
                    doc.moveDown(0.5);
                    blankCount = 0;
                    break;
                }

                case 'h3': {
                    if (remainingY < 50) doc.addPage();
                    else doc.moveDown(0.8);
                    doc.font('Helvetica-Bold').fontSize(SIZE.h3).fillColor(COLORS.darkBlue)
                        .text(cleanText(token.text), { width: pageWidth });
                    doc.moveDown(0.3);
                    blankCount = 0;
                    break;
                }

                case 'h4': {
                    if (remainingY < 40) doc.addPage();
                    doc.font('Helvetica-Bold').fontSize(SIZE.h4).fillColor(COLORS.gray)
                        .text(cleanText(token.text), { width: pageWidth });
                    doc.moveDown(0.2);
                    blankCount = 0;
                    break;
                }

                case 'para': {
                    const txt = cleanText(token.text);
                    if (!txt) break;
                    if (remainingY < 30) doc.addPage();
                    doc.font('Helvetica').fontSize(SIZE.body).fillColor(COLORS.black)
                        .text(txt, { width: pageWidth, lineGap: 2, align: 'justify' });
                    blankCount = 0;
                    break;
                }

                case 'bullet': {
                    if (remainingY < 25) doc.addPage();
                    const txt = cleanText(token.text);
                    doc.font('Helvetica').fontSize(SIZE.body).fillColor(COLORS.black)
                        .text(`•  ${txt}`, MARGIN.left + 10, doc.y, { width: pageWidth - 10, lineGap: 1 });
                    blankCount = 0;
                    break;
                }

                case 'numbered': {
                    if (remainingY < 25) doc.addPage();
                    const txt = cleanText(token.text);
                    doc.font('Helvetica').fontSize(SIZE.body).fillColor(COLORS.black)
                        .text(`${token.num}.  ${txt}`, MARGIN.left + 10, doc.y, { width: pageWidth - 10, lineGap: 1 });
                    blankCount = 0;
                    break;
                }

                case 'code': {
                    const codeLines = token.text.split('\n');
                    const estimatedHeight = codeLines.length * (SIZE.code + 3) + 20;
                    if (estimatedHeight > remainingY) doc.addPage();
                    const startY = doc.y;
                    const boxX = MARGIN.left - 3;
                    const boxW = pageWidth + 6;

                    // Draw box first (estimate height)
                    doc.rect(boxX, startY, boxW, estimatedHeight)
                        .fill(COLORS.codeBackground).stroke(COLORS.codeBorder);

                    doc.font('Courier').fontSize(SIZE.code).fillColor('#1e293b');
                    for (const codeLine of codeLines) {
                        if (doc.y > doc.page.height - MARGIN.bottom - 20) {
                            doc.addPage();
                        }
                        doc.text(codeLine || ' ', MARGIN.left, doc.y, {
                            width: pageWidth, lineBreak: false, lineGap: 1
                        });
                        doc.y += SIZE.code + 2;
                    }
                    doc.moveDown(0.5);
                    blankCount = 0;
                    break;
                }

                case 'table': {
                    const rows = token.rows;
                    if (!rows || rows.length === 0) break;
                    const maxCols = Math.max(...rows.map(r => r.length));
                    if (maxCols === 0) break;
                    const colWidth = pageWidth / maxCols;
                    const rowHeight = 18;
                    const tableHeight = rows.length * rowHeight + 4;

                    if (tableHeight > remainingY) doc.addPage();

                    let ty = doc.y;
                    rows.forEach((row, rowIdx) => {
                        // Row background
                        const bg = rowIdx === 0 ? COLORS.tableHeader : (rowIdx % 2 === 0 ? COLORS.tableRow2 : COLORS.tableRow1);
                        doc.rect(MARGIN.left, ty, pageWidth, rowHeight).fill(bg);

                        const textColor = rowIdx === 0 ? COLORS.tableHeaderText : COLORS.black;
                        const fontName = rowIdx === 0 ? 'Helvetica-Bold' : 'Helvetica';

                        row.forEach((cell, ci) => {
                            const cellX = MARGIN.left + ci * colWidth + 4;
                            doc.font(fontName).fontSize(SIZE.small)
                                .fillColor(textColor)
                                .text(cleanText(cell), cellX, ty + 5, {
                                    width: colWidth - 8, lineBreak: false, ellipsis: true
                                });
                        });
                        // Row border
                        doc.rect(MARGIN.left, ty, pageWidth, rowHeight)
                            .strokeColor(COLORS.tableBorder).lineWidth(0.3).stroke();
                        ty += rowHeight;
                    });

                    doc.y = ty + 4;
                    doc.moveDown(0.3);
                    blankCount = 0;
                    break;
                }

                case 'hr': {
                    doc.moveDown(0.5);
                    doc.moveTo(MARGIN.left, doc.y)
                        .lineTo(MARGIN.left + pageWidth, doc.y)
                        .strokeColor(COLORS.tableBorder).lineWidth(0.5).stroke();
                    doc.moveDown(0.5);
                    blankCount++;
                    break;
                }

                case 'blank': {
                    blankCount++;
                    if (blankCount <= 2) doc.moveDown(0.3);
                    break;
                }
            }
        }

        // Add page break between parts
        doc.addPage();
    }

    doc.end();

    stream.on('finish', () => {
        console.log(`\n✅ PDF Generated Successfully!`);
        console.log(`📁 Location: ${OUTPUT_PATH}`);
        console.log(`📄 File: WanderLust_Project_Report.pdf`);
    });

    stream.on('error', (err) => {
        console.error('❌ Error generating PDF:', err);
    });
}

generatePDF();
