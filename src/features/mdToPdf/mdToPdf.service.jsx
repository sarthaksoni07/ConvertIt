import { marked } from "marked";
import { PDFDocument, StandardFonts, rgb, PageSizes } from "pdf-lib";

/* ── Page Layout ──────────────────────────────────────────────── */
const PAGE = PageSizes.Letter;                       // [612, 792]
const MARGIN = { top: 56, right: 54, bottom: 56, left: 54 };
const CW = PAGE[0] - MARGIN.left - MARGIN.right;    // content width
const PAGE_TOP = PAGE[1] - MARGIN.top;
const PAGE_BOT = MARGIN.bottom;

/* ── Font Sizes ───────────────────────────────────────────────── */
const SZ = {
  body: 11, h1: 22, h2: 17, h3: 14, h4: 12, h5: 11, h6: 10,
  code: 9, table: 10,
};
const LH = { body: 1.65, heading: 1.35, code: 1.55, table: 1.5 };

/* ── Colors ───────────────────────────────────────────────────── */
const CLR = {
  text:     rgb(0.133, 0.133, 0.133),
  h1:       rgb(0.067, 0.067, 0.067),
  h2:       rgb(0.10,  0.10,  0.10),
  h3:       rgb(0.133, 0.133, 0.133),
  h4:       rgb(0.20,  0.20,  0.20),
  h5:       rgb(0.27,  0.27,  0.27),
  h6:       rgb(0.33,  0.33,  0.33),
  link:     rgb(0.145, 0.388, 0.922),
  iCode:    rgb(0.78,  0.145, 0.306),
  iCodeBg:  rgb(0.945, 0.961, 0.973),
  codeBg:   rgb(0.118, 0.161, 0.231),
  codeFg:   rgb(0.886, 0.910, 0.941),
  bqBorder: rgb(0.231, 0.510, 0.965),
  bqBg:     rgb(0.937, 0.965, 1.0),
  bqText:   rgb(0.118, 0.227, 0.373),
  tBorder:  rgb(0.796, 0.831, 0.882),
  tHeadBg:  rgb(0.945, 0.961, 0.973),
  tStripe:  rgb(0.973, 0.980, 0.988),
  hr:       rgb(0.820, 0.835, 0.859),
  white:    rgb(1, 1, 1),
};

/* ── Helpers ──────────────────────────────────────────────────── */

/** Sanitise text to the WinAnsi range (standard PDF fonts). */
const FALLBACK_CHARS = {
  "\u2190": "<-",
  "\u2192": "->",
  "\u2194": "<->",
  "\u21d2": "=>",
  "\u2500": "-",
  "\u2501": "-",
  "\u2502": "|",
  "\u250c": "+",
  "\u2510": "+",
  "\u2514": "+",
  "\u2518": "+",
  "\u251c": "+",
  "\u2524": "+",
  "\u252c": "+",
  "\u2534": "+",
  "\u253c": "+",
  "\u2550": "=",
  "\u2551": "|",
  "\u2554": "+",
  "\u2557": "+",
  "\u255a": "+",
  "\u255d": "+",
  "\u2560": "+",
  "\u2563": "+",
  "\u2566": "+",
  "\u2569": "+",
  "\u256c": "+",
  "\u2570": "+",
  "\u256f": "+",
  "\u256d": "+",
  "\u256e": "+",
  "\u2713": "[x]",
  "\u2717": "[ ]",
  "\u2022": "*",
};

function san(t, { preserveNewlines = false } = {}) {
  const safe = (t || "")
    .replace(/[\u2190\u2192\u2194\u21d2\u2500-\u257f\u2713\u2717\u2022]/g, (ch) => FALLBACK_CHARS[ch] ?? "")
    .replace(/[\u2018\u2019`\u00B4]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, "--")
    .replace(/\u2013/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/\t/g, "    ");

  const nonAnsi = preserveNewlines
    ? /[^\x20-\x7E\xA0-\xFF\r\n]/g
    : /[^\x20-\x7E\xA0-\xFF]/g;
  return safe.replace(nonAnsi, "");
}

function decEnt(text) {
  const m = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };
  return text.replace(/&(?:amp|lt|gt|quot|#39);/g, (k) => m[k] ?? k);
}

/* ═══════════════════════════════════════════════════════════════
   PdfBuilder — renders marked tokens directly with pdf-lib
   ═══════════════════════════════════════════════════════════════ */

class PdfBuilder {
  page = null;
  y = PAGE_TOP;

  /* ── Initialisation ── */

  async build(markdown) {
    this.doc = await PDFDocument.create();

    this.F = {
      r:  await this.doc.embedFont(StandardFonts.Helvetica),
      b:  await this.doc.embedFont(StandardFonts.HelveticaBold),
      i:  await this.doc.embedFont(StandardFonts.HelveticaOblique),
      bi: await this.doc.embedFont(StandardFonts.HelveticaBoldOblique),
      m:  await this.doc.embedFont(StandardFonts.Courier),
      mb: await this.doc.embedFont(StandardFonts.CourierBold),
    };

    this.addPage();

    marked.setOptions({ gfm: true, breaks: false });
    const tokens = marked.lexer(markdown);

    for (const tok of tokens) this.renderBlock(tok);

    return this.doc.save();
  }

  /* ── Page management ── */

  addPage() {
    this.page = this.doc.addPage(PAGE);
    this.y = PAGE_TOP;
  }

  ensure(h) {
    if (this.y - h < PAGE_BOT) { this.addPage(); return true; }
    return false;
  }

  gap(pts) {
    this.y -= pts;
    if (this.y < PAGE_BOT) this.addPage();
  }

  /* ── Inline token flattening ──
     Converts nested marked inline tokens into a flat list of
     { t, bold, italic, code, link } segments.                   */

  flatten(tokens, ctx = {}) {
    const out = [];
    if (!tokens) return out;
    for (const tok of tokens) {
      switch (tok.type) {
        case "text": {
          const sub = tok.tokens ? this.flatten(tok.tokens, ctx) : null;
          if (sub) { out.push(...sub); break; }
          out.push({ t: san(decEnt(tok.text)).replace(/\n/g, " "), ...ctx });
          break;
        }
        case "strong":
          out.push(...this.flatten(tok.tokens, { ...ctx, bold: true }));
          break;
        case "em":
          out.push(...this.flatten(tok.tokens, { ...ctx, italic: true }));
          break;
        case "codespan":
          out.push({ t: san(decEnt(tok.text)), code: true });
          break;
        case "link":
          out.push(...this.flatten(tok.tokens, { ...ctx, link: tok.href }));
          break;
        case "br":
          out.push({ t: "\n" });
          break;
        case "del":
          out.push(...this.flatten(tok.tokens, ctx));
          break;
        case "image":
          out.push({ t: san(`[${tok.text || "image"}]`), italic: true, link: tok.href });
          break;
        default:
          if (tok.tokens) out.push(...this.flatten(tok.tokens, ctx));
          else if (tok.text) out.push({ t: san(decEnt(tok.text)), ...ctx });
          break;
      }
    }
    return out;
  }

  font(s) {
    if (s.code) return this.F.m;
    if (s.bold && s.italic) return this.F.bi;
    if (s.bold) return this.F.b;
    if (s.italic) return this.F.i;
    return this.F.r;
  }

  color(s, def = CLR.text) {
    if (s.code) return CLR.iCode;
    if (s.link) return CLR.link;
    return def;
  }

  textW(text, font, size) {
    try { return font.widthOfTextAtSize(text, size); }
    catch { return 0; }
  }

  splitToFit(text, font, size, maxWidth) {
    const out = [];
    let part = "";
    let partW = 0;

    for (const ch of text) {
      const chW = this.textW(ch, font, size);
      if (part && partW + chW > maxWidth) {
        out.push(part);
        part = ch;
        partW = chW;
        continue;
      }
      if (!part && chW > maxWidth) {
        out.push(ch);
        continue;
      }
      part += ch;
      partW += chW;
    }

    if (part) out.push(part);
    return out.length ? out : [text];
  }

  /* ── Text wrapping ──
     Takes flat segments and wraps into lines that fit maxWidth.
     Each line = array of { t, f, sz, c, link }.                */

  wrapLines(segments, fontSize, maxWidth, defColor = CLR.text, opts = {}) {
    const { keepLeadingSpaces = false } = opts;
    const usableW = Math.max(8, maxWidth);
    const lines = [[]];
    let lw = 0;

    for (const seg of segments) {
      const f = this.font(seg);
      const c = this.color(seg, defColor);
      const sz = seg.code ? SZ.code : fontSize;

      if (seg.t === "\n") { lines.push([]); lw = 0; continue; }

      const words = seg.t.split(/( +)/);
      for (const w of words) {
        if (!w) continue;
        const pieces = this.textW(w, f, sz) > usableW ? this.splitToFit(w, f, sz, usableW) : [w];
        for (const piece of pieces) {
          const ww = this.textW(piece, f, sz);
          if (ww <= 0) continue;
          if (!keepLeadingSpaces && lw === 0 && piece.trim() === "") continue;
          if (lw + ww > usableW && lw > 0) {
            lines.push([]);
            lw = 0;
            if (!keepLeadingSpaces && piece.trim() === "") continue;
          }
          lines[lines.length - 1].push({ t: piece, f, sz, c, link: seg.link });
          lw += ww;
        }
      }
    }
    return lines;
  }

  wrapCodeLine(line, font, size, maxWidth) {
    if (line.length === 0) return [""];
    return this.splitToFit(line, font, size, Math.max(8, maxWidth));
  }

  /* ── Drawing helpers ── */

  drawLineAt(line, x, y, drawIcBg = true) {
    let cx = x;
    for (const s of line) {
      const tw = this.textW(s.t, s.f, s.sz);
      if (tw <= 0) continue;

      if (drawIcBg && s.c === CLR.iCode) {
        this.page.drawRectangle({
          x: cx - 2, y: y - 3,
          width: tw + 4, height: s.sz + 6,
          color: CLR.iCodeBg,
        });
      }
      try {
        this.page.drawText(s.t, { x: cx, y, font: s.f, size: s.sz, color: s.c });
      } catch { /* skip unencodable chars */ }
      cx += tw;
    }
  }

  drawLines(lines, x, lineH, drawIcBg = true) {
    for (const line of lines) {
      this.ensure(lineH);
      this.drawLineAt(line, x, this.y, drawIcBg);
      this.y -= lineH;
    }
  }

  linesH(lines, lineH) { return lines.length * lineH; }

  /* ═══════════════════════════════════════════════════════════
     Block renderers
     ═══════════════════════════════════════════════════════════ */

  renderBlock(tok) {
    switch (tok.type) {
      case "heading":    return this.rHeading(tok);
      case "paragraph":  return this.rPara(tok);
      case "code":       return this.rCode(tok);
      case "list":       return this.rList(tok, 0);
      case "blockquote": return this.rBlockquote(tok);
      case "table":      return this.rTable(tok);
      case "hr":         return this.rHr();
      case "space":      return this.gap(6);
      default:           return;
    }
  }

  /* ── Heading ── */

  rHeading(tok) {
    const d = tok.depth;
    const sz = SZ[`h${d}`];
    const lineH = sz * LH.heading;
    const before = [0, 18, 16, 14, 12, 10, 8][d];
    const after  = [0, 10, 8, 6, 5, 4, 4][d];
    const hClr   = [null, CLR.h1, CLR.h2, CLR.h3, CLR.h4, CLR.h5, CLR.h6][d];

    this.gap(before);

    const segs = this.flatten(tok.tokens).map((s) => ({ ...s, bold: true }));
    const lines = this.wrapLines(segs, sz, CW, hClr);

    // Keep heading with following content
    const totalH = this.linesH(lines, lineH) + after + lineH * 2;
    this.ensure(totalH);

    this.drawLines(lines, MARGIN.left, lineH, false);

    if (d === 1) {
      this.y -= 4;
      this.page.drawLine({
        start: { x: MARGIN.left, y: this.y },
        end: { x: PAGE[0] - MARGIN.right, y: this.y },
        thickness: 2, color: CLR.h1,
      });
      this.y -= 3;
    } else if (d === 2) {
      this.y -= 3;
      this.page.drawLine({
        start: { x: MARGIN.left, y: this.y },
        end: { x: PAGE[0] - MARGIN.right, y: this.y },
        thickness: 0.75, color: CLR.hr,
      });
      this.y -= 2;
    }

    this.gap(after);
  }

  /* ── Paragraph ── */

  rPara(tok, indent = 0, defColor = CLR.text) {
    const segs = this.flatten(tok.tokens);
    const lineH = SZ.body * LH.body;
    const lines = this.wrapLines(segs, SZ.body, CW - indent, defColor);

    if (lines.length <= 6) this.ensure(this.linesH(lines, lineH));

    this.drawLines(lines, MARGIN.left + indent, lineH);
    this.gap(8);
  }

  /* ── Code Block ── */

  rCode(tok) {
    const raw = san(decEnt(tok.text || ""), { preserveNewlines: true }).replace(/\r\n?/g, "\n");
    const sz = SZ.code;
    const lineH = sz * LH.code;
    const pad = { x: 12, y: 10 };
    const f = this.F.m;
    const maxTextW = CW - pad.x * 2;
    const codeLines = raw.split("\n").flatMap((line) => this.wrapCodeLine(line, f, sz, maxTextW));
    const totalH = codeLines.length * lineH + pad.y * 2;

    const pageH = PAGE_TOP - PAGE_BOT;
    if (totalH <= pageH) {
      this.ensure(totalH + 8);
    } else {
      this.ensure(Math.min(totalH, lineH * 3 + pad.y * 2));
    }

    this.y -= 4;
    let idx = 0;

    while (idx < codeLines.length) {
      const avail = this.y - PAGE_BOT;
      const maxOnPage = Math.floor((avail - pad.y * 2) / lineH);
      if (maxOnPage <= 0) { this.addPage(); continue; }
      const chunk = codeLines.slice(idx, idx + maxOnPage);
      const chunkH = chunk.length * lineH + pad.y * 2;

      // Dark background
      this.page.drawRectangle({
        x: MARGIN.left, y: this.y - chunkH,
        width: CW, height: chunkH,
        color: CLR.codeBg,
      });

      // Code text
      let ty = this.y - pad.y - sz;
      for (const line of chunk) {
        try {
          if (line) {
            this.page.drawText(line, {
              x: MARGIN.left + pad.x, y: ty,
              font: f, size: sz, color: CLR.codeFg,
            });
          }
        } catch { /* skip unencodable */ }
        ty -= lineH;
      }

      this.y -= chunkH;
      idx += chunk.length;
      if (idx < codeLines.length) this.addPage();
    }

    this.gap(10);
  }

  /* ── List ── */

  rList(tok, indent) {
    const ordered = tok.ordered;
    const start = tok.start ?? 1;

    tok.items.forEach((item, idx) => {
      const lineH = SZ.body * LH.body;
      this.ensure(lineH);

      const bulletX = MARGIN.left + indent;
      const textIndent = indent + 20;

      if (ordered) {
        const num = `${start + idx}. `;
        try {
          this.page.drawText(san(num), {
            x: bulletX, y: this.y,
            font: this.F.r, size: SZ.body, color: CLR.text,
          });
        } catch { /* */ }
      } else {
        this.page.drawCircle({
          x: bulletX + 5, y: this.y + SZ.body * 0.3,
          size: 1.8, color: CLR.text,
        });
      }

      // Task-list checkbox
      let extra = 0;
      if (item.task) {
        const mark = item.checked ? "[x] " : "[ ] ";
        try {
          this.page.drawText(mark, {
            x: MARGIN.left + textIndent, y: this.y,
            font: this.F.m, size: SZ.body, color: CLR.text,
          });
          extra = this.F.m.widthOfTextAtSize(mark, SZ.body);
        } catch { /* */ }
      }

      this._itemContent(item, textIndent + extra, lineH);
      this.gap(3);
    });

    if (indent === 0) this.gap(6);
  }

  _itemContent(item, textIndent, lineH) {
    if (!item.tokens) return;
    let first = true;

    for (const child of item.tokens) {
      if ((child.type === "text" || child.type === "paragraph") && first) {
        const toks = child.tokens ?? [{ type: "text", text: child.text }];
        const segs = this.flatten(toks);
        const lines = this.wrapLines(segs, SZ.body, CW - textIndent);

        if (lines.length > 0 && lines[0].length > 0) {
          let cx = MARGIN.left + textIndent;
          for (const s of lines[0]) {
            try {
              const tw = s.f.widthOfTextAtSize(s.t, s.sz);
              if (s.c === CLR.iCode) {
                this.page.drawRectangle({
                  x: cx - 2, y: this.y - 3,
                  width: tw + 4, height: s.sz + 6, color: CLR.iCodeBg,
                });
              }
              this.page.drawText(s.t, { x: cx, y: this.y, font: s.f, size: s.sz, color: s.c });
              cx += tw;
            } catch { /* */ }
          }
          this.y -= lineH;

          if (lines.length > 1) {
            this.drawLines(lines.slice(1), MARGIN.left + textIndent, lineH);
          }
        } else {
          this.y -= lineH;
        }

        if (child.type === "paragraph") this.gap(4);
        first = false;
      } else if (child.type === "list") {
        if (first) { this.y -= lineH; first = false; }
        this.rList(child, textIndent);
      } else if (child.type === "code") {
        if (first) { this.y -= lineH; first = false; }
        this.rCode(child);
      } else if (child.type === "paragraph" && !first) {
        this.rPara(child, textIndent);
      } else {
        if (first) { this.y -= lineH; first = false; }
        this.renderBlock(child);
      }
    }
  }

  /* ── Blockquote ── */

  rBlockquote(tok) {
    const indent = 24;
    const lineH = SZ.body * LH.body;
    // Top pad needs extra room for font ascender (~8pt at 11pt body)
    const padTop = 18;
    const padBot = 12;

    // Pre-wrap all child paragraphs to measure total height
    const prepared = [];
    for (const child of tok.tokens) {
      if (child.type === "paragraph") {
        const segs = this.flatten(child.tokens);
        const lines = this.wrapLines(segs, SZ.body, CW - indent, CLR.bqText);
        prepared.push({ kind: "para", lines });
      } else if (child.type === "blockquote") {
        const inner = [];
        for (const c of child.tokens) {
          if (c.type === "paragraph" && c.tokens) {
            inner.push(...this.flatten(c.tokens));
          }
        }
        const lines = this.wrapLines(inner, SZ.body, CW - indent - 16, CLR.bqText);
        prepared.push({ kind: "nested", lines });
      } else {
        prepared.push({ kind: "block", token: child });
      }
    }

    // Calculate total height
    let totalH = padTop + padBot;
    for (const p of prepared) {
      if (p.lines) totalH += this.linesH(p.lines, lineH) + 4;
      else totalH += lineH * 2;
    }

    const pageH = PAGE_TOP - PAGE_BOT;
    if (totalH <= pageH) this.ensure(totalH);

    // Draw background first, then content on top
    this.page.drawRectangle({
      x: MARGIN.left, y: this.y - totalH,
      width: CW, height: totalH,
      color: CLR.bqBg,
    });
    this.page.drawRectangle({
      x: MARGIN.left, y: this.y - totalH,
      width: 4, height: totalH,
      color: CLR.bqBorder,
    });

    this.y -= padTop;
    for (const p of prepared) {
      if (p.kind === "para") {
        this.drawLines(p.lines, MARGIN.left + indent, lineH);
        this.gap(4);
      } else if (p.kind === "nested") {
        const nestedH = this.linesH(p.lines, lineH) + 8;
        this.page.drawRectangle({
          x: MARGIN.left + indent - 8, y: this.y - nestedH,
          width: 3, height: nestedH,
          color: CLR.bqBorder,
        });
        this.drawLines(p.lines, MARGIN.left + indent + 8, lineH);
        this.gap(4);
      } else if (p.token) {
        this.renderBlock(p.token);
      }
    }
    this.y -= padBot;

    this.gap(10);
  }

  /* ── Table ── */

  rTable(tok) {
    const sz = SZ.table;
    const lineH = sz * LH.table;
    const cellPad = { x: 8, y: 5 };
    const numCols = tok.header.length;
    if (numCols === 0) return;

    const cellText = (cell) => {
      if (!cell) return "";
      if (typeof cell.text === "string") return san(decEnt(cell.text));
      const segs = this.flatten(cell.tokens ?? []);
      return segs.map((s) => s.t).join("");
    };

    const minColW = Math.max(52, CW / numCols * 0.5);
    const maxColW = Math.max(minColW, CW * 0.65);
    const colW = new Array(numCols).fill(minColW);

    for (let c = 0; c < numCols; c++) {
      const hText = cellText(tok.header[c]);
      colW[c] = Math.max(colW[c], Math.min(maxColW, this.textW(hText, this.F.b, sz) + cellPad.x * 2));

      for (const row of tok.rows) {
        const rText = cellText(row[c]);
        colW[c] = Math.max(colW[c], Math.min(maxColW, this.textW(rText, this.F.r, sz) + cellPad.x * 2));
      }
    }

    const total = colW.reduce((a, b) => a + b, 0);
    if (total > 0 && Math.abs(total - CW) > 0.01) {
      const scale = CW / total;
      for (let i = 0; i < numCols; i++) colW[i] *= scale;
    }

    this.y -= 4;

    const rowDefs = [
      { cells: tok.header, isHeader: true, isEven: false },
      ...tok.rows.map((cells, i) => ({ cells, isHeader: false, isEven: i % 2 === 1 })),
    ];

    for (const rowDef of rowDefs) {
      const wrappedPerCol = [];
      let maxLines = 1;

      for (let c = 0; c < numCols; c++) {
        const cell = rowDef.cells[c];
        const base = cell?.tokens ?? [{ type: "text", text: cellText(cell) }];
        const segs = this.flatten(base).map((s) => (rowDef.isHeader ? { ...s, bold: true } : s));
        const lines = this.wrapLines(
          segs,
          sz,
          colW[c] - cellPad.x * 2,
          rowDef.isHeader ? CLR.h1 : CLR.text
        );
        wrappedPerCol[c] = lines.length ? lines : [[]];
        maxLines = Math.max(maxLines, wrappedPerCol[c].length);
      }

      let lineOffset = 0;
      while (lineOffset < maxLines) {
        const avail = this.y - PAGE_BOT;
        const maxLinesOnPage = Math.floor((avail - cellPad.y * 2) / lineH);
        if (maxLinesOnPage <= 0) { this.addPage(); continue; }

        const linesThisChunk = Math.max(1, Math.min(maxLinesOnPage, maxLines - lineOffset));
        const rowH = linesThisChunk * lineH + cellPad.y * 2;
        this.ensure(rowH);

        let x = MARGIN.left;
        for (let c = 0; c < numCols; c++) {
          const bg = rowDef.isHeader ? CLR.tHeadBg : rowDef.isEven ? CLR.tStripe : CLR.white;
          this.page.drawRectangle({
            x, y: this.y - rowH, width: colW[c], height: rowH, color: bg,
          });
          this.page.drawRectangle({
            x, y: this.y - rowH, width: colW[c], height: rowH,
            borderColor: CLR.tBorder, borderWidth: 0.5,
          });

          const lines = wrappedPerCol[c].slice(lineOffset, lineOffset + linesThisChunk);
          let ty = this.y - cellPad.y - sz;
          for (const line of lines) {
            this.drawLineAt(line, x + cellPad.x, ty);
            ty -= lineH;
          }
          x += colW[c];
        }

        this.y -= rowH;
        lineOffset += linesThisChunk;
      }
    }

    this.gap(12);
  }

  /* ── Horizontal Rule ── */

  rHr() {
    this.gap(14);
    this.ensure(2);
    this.page.drawLine({
      start: { x: MARGIN.left, y: this.y },
      end: { x: PAGE[0] - MARGIN.right, y: this.y },
      thickness: 1, color: CLR.hr,
    });
    this.gap(14);
  }
}

/* ═══════════════════════════════════════════════════════════════
   Public API — same signature as before
   ═══════════════════════════════════════════════════════════════ */

export async function convertMdToPdf(text, fileName = "markdown") {
  const builder = new PdfBuilder();
  const pdfBytes = await builder.build(text);

  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const name = (fileName.replace(/\.(md|markdown|txt)$/i, "") || "markdown") + ".pdf";

  return {
    name,
    blob,
    originalSize: blob.size,
    compressedSize: blob.size,
  };
}
