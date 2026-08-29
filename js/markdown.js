/**
 * A lightweight, custom Markdown-to-HTML parser designed for the Codex blog.
 * Supports standard formatting, blockquotes, lists, custom footnotes/marginalia, and LaTeX math via KaTeX.
 */
export function parseMarkdown(markdown) {
  if (!markdown) return '';

  const lines = markdown.split('\n');
  let html = '';
  let inList = false;
  let inBlockquote = false;
  const footnotes = {};
  const mathTokens = [];

  // Math placeholder system to prevent markdown formatting (_italic_, *bold*, etc.)
  // from corrupting LaTeX commands and subscripts (like \Gamma_0, V_\infty, C_{D_i})
  function stashMath(tex, displayMode) {
    const id = mathTokens.length;
    mathTokens.push({ tex, displayMode });
    return `@@@CODEX_MATH_${id}@@@`;
  }

  function renderMath(tex, displayMode = false) {
    if (typeof window !== 'undefined' && window.katex) {
      try {
        return window.katex.renderToString(tex, { displayMode, throwOnError: false });
      } catch (e) {
        console.error('KaTeX rendering error:', e);
      }
    }
    return displayMode 
      ? `<div class="math-block"><code>\\[${tex}\\]</code></div>` 
      : `<code class="math-inline">\\(${tex}\\)</code>`;
  }

  function restoreMath(str) {
    return str.replace(/@@@CODEX_MATH_(\d+)@@@/g, (match, id) => {
      const token = mathTokens[parseInt(id, 10)];
      if (!token) return match;
      const rendered = renderMath(token.tex, token.displayMode);
      return token.displayMode ? `<div class="math-block">${rendered}</div>` : rendered;
    });
  }
  
  // First pass: Extract footnotes [^1]: text
  const cleanedLines = [];
  const footnoteRegex = /^\[\^([^\]]+)\]:\s*(.*)$/;
  
  for (let line of lines) {
    const match = line.match(footnoteRegex);
    if (match) {
      footnotes[match[1]] = match[2].trim();
    } else {
      cleanedLines.push(line);
    }
  }

  // Second pass: Parse block elements
  for (let i = 0; i < cleanedLines.length; i++) {
    let line = cleanedLines[i].trim();

    // Empty line
    if (line === '') {
      if (inList) {
        html += '</ul>\n';
        inList = false;
      }
      if (inBlockquote) {
        html += '</blockquote>\n';
        inBlockquote = false;
      }
      continue;
    }

    // Multiline display math: $$ on its own line
    if (line === '$$' || line === '\\[') {
      if (inList) { html += '</ul>\n'; inList = false; }
      if (inBlockquote) { html += '</blockquote>\n'; inBlockquote = false; }
      let mathContent = '';
      i++;
      while (i < cleanedLines.length && cleanedLines[i].trim() !== '$$' && cleanedLines[i].trim() !== '\\]') {
        mathContent += (mathContent ? '\n' : '') + cleanedLines[i];
        i++;
      }
      html += `<div class="math-block">${renderMath(mathContent.trim(), true)}</div>\n`;
      continue;
    }

    // Single-line block display math $$ ... $$ or \[ ... \]
    if (line.startsWith('$$') && line.endsWith('$$') && line.length > 4) {
      if (inList) { html += '</ul>\n'; inList = false; }
      if (inBlockquote) { html += '</blockquote>\n'; inBlockquote = false; }
      const tex = line.substring(2, line.length - 2).trim();
      html += `<div class="math-block">${renderMath(tex, true)}</div>\n`;
      continue;
    }
    if (line.startsWith('\\[') && line.endsWith('\\]') && line.length > 4) {
      if (inList) { html += '</ul>\n'; inList = false; }
      if (inBlockquote) { html += '</blockquote>\n'; inBlockquote = false; }
      const tex = line.substring(2, line.length - 2).trim();
      html += `<div class="math-block">${renderMath(tex, true)}</div>\n`;
      continue;
    }

    // Horizontal Rules / Ornamental Dividers
    if (line === '---' || line === '***' || line === '___') {
      if (inList) { html += '</ul>\n'; inList = false; }
      if (inBlockquote) { html += '</blockquote>\n'; inBlockquote = false; }
      html += '<hr class="codex-divider" />\n';
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      html += `<h1>${parseInline(line.substring(2))}</h1>\n`;
      continue;
    }
    if (line.startsWith('## ')) {
      html += `<h2>${parseInline(line.substring(3))}</h2>\n`;
      continue;
    }
    if (line.startsWith('### ')) {
      html += `<h3>${parseInline(line.substring(4))}</h3>\n`;
      continue;
    }

    // Images
    if (line.startsWith('![')) {
      const match = line.match(/^!\[(.*)\]\(([^)]+)\)$/);
      if (match) {
        if (inList) { html += '</ul>\n'; inList = false; }
        if (inBlockquote) { html += '</blockquote>\n'; inBlockquote = false; }
        let alt = match[1];
        let src = match[2];

        let sizeClass = '';
        if (src.includes('#small') || alt.endsWith('|small')) {
          sizeClass = ' small';
          src = src.replace('#small', '');
          alt = alt.replace('|small', '');
        } else if (src.includes('#medium') || alt.endsWith('|medium')) {
          sizeClass = ' medium';
          src = src.replace('#medium', '');
          alt = alt.replace('|medium', '');
        } else if (src.includes('#large') || alt.endsWith('|large')) {
          sizeClass = ' large';
          src = src.replace('#large', '');
          alt = alt.replace('|large', '');
        }

        const cleanAltAttr = alt.replace(/\[\^[^\]]+\]/g, '').replace(/"/g, '&quot;');
        const parsedCaption = parseInline(alt);
        html += `<figure class="article-figure${sizeClass}"><img src="${src}" alt="${cleanAltAttr}" class="article-image${sizeClass}" />${alt ? `<figcaption>${parsedCaption}</figcaption>` : ''}</figure>\n`;
        continue;
      }
    }

    // Sidenotes / Marginalia: > [!sidenote: Title] or > [!sidenote] or > [!note]
    if (line.startsWith('> [!sidenote') || line.startsWith('> [!note')) {
      if (inList) { html += '</ul>\n'; inList = false; }
      if (inBlockquote) { html += '</blockquote>\n'; inBlockquote = false; }
      const match = line.match(/^>\s*\[!(?:sidenote|note)(?::\s*([^\]]+))?\]\s*(.*)$/i);
      let title = (match && match[1]) ? match[1].trim() : 'Marginal Note';
      let body = (match && match[2]) ? match[2].trim() : '';
      
      const boldMatch = body.match(/^\*\*([^*]+)\*\*:\s*(.*)$/);
      if (boldMatch) {
        title = boldMatch[1].trim();
        body = boldMatch[2].trim();
      }

      html += `<aside class="article-sidenote"><div class="sidenote-header"><i data-lucide="info"></i> <span>${title}</span></div><div class="sidenote-body">${parseInline(body)}</div></aside>\n`;
      continue;
    }

    // Direct HTML blocks (like <aside> or custom <div>)
    if (line.startsWith('<aside') || line.startsWith('<div')) {
      if (inList) { html += '</ul>\n'; inList = false; }
      if (inBlockquote) { html += '</blockquote>\n'; inBlockquote = false; }
      html += `${line}\n`;
      continue;
    }

    // Blockquotes
    if (line.startsWith('> ')) {
      if (!inBlockquote) {
        html += '<blockquote>\n';
        inBlockquote = true;
      }
      html += `<p>${parseInline(line.substring(2))}</p>\n`;
      continue;
    }

    // Unordered Lists
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        html += '<ul>\n';
        inList = true;
      }
      html += `<li>${parseInline(line.substring(2))}</li>\n`;
      continue;
    }

    // Regular paragraphs
    if (inList) {
      html += '</ul>\n';
      inList = false;
    }
    if (inBlockquote) {
      html += '</blockquote>\n';
      inBlockquote = false;
    }

    // Drop cap for the very first paragraph of the article (if it's not a heading/list/etc)
    const isFirstParagraph = html === '' || html.endsWith('</h1>\n') || html.endsWith('</h2>\n');
    if (isFirstParagraph) {
      html += `<p class="drop-cap">${parseInline(line)}</p>\n`;
    } else {
      html += `<p>${parseInline(line)}</p>\n`;
    }
  }

  // Close any open lists or blockquotes
  if (inList) html += '</ul>\n';
  if (inBlockquote) html += '</blockquote>\n';

  // Append footnotes section if footnotes exist
  if (Object.keys(footnotes).length > 0) {
    html += `<div class="footnotes-section">\n<h4>Footnotes</h4>\n<ol>\n`;
    for (const [key, val] of Object.entries(footnotes)) {
      html += `<li id="fn-${key}">${parseInline(val)} <a href="#fnref-${key}" class="footnote-backref">↩</a></li>\n`;
    }
    html += `</ol>\n</div>\n`;
  }

  // Inline formatting helper
  function parseInline(text) {
    let output = text;

    // 1. Stash Math Expressions into placeholders FIRST (so TeX syntax isn't altered by bold/italic/links)
    // Display Math: $$...$$ or \[...\]
    output = output.replace(/\$\$([\s\S]+?)\$\$/g, (m, tex) => stashMath(tex.trim(), true));
    output = output.replace(/\\\[([\s\S]+?)\\\]/g, (m, tex) => stashMath(tex.trim(), true));

    // Inline Math: \(...\) or $...$
    output = output.replace(/\\\(([\s\S]+?)\\\)/g, (m, tex) => stashMath(tex.trim(), false));
    output = output.replace(/\$([^$\n]+?)\$/g, (m, tex) => stashMath(tex.trim(), false));

    // 2. Standard Markdown Formatting
    // Bold: **text** or __text__
    output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    output = output.replace(/\b__([^_]+)__\b/g, '<strong>$1</strong>');

    // Italics: *text* or _text_
    output = output.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    output = output.replace(/(^|\s)_([^_]+)_(?=\s|$|[.,;:!?])/g, '$1<em>$2</em>');

    // Inline code: `code`
    output = output.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Footnote references: [^1]
    output = output.replace(/\[\^([^\]]+)\]/g, (match, id) => {
      const note = footnotes[id] ? footnotes[id].replace(/"/g, '&quot;') : '';
      return `<a href="#fn-${id}" id="fnref-${id}" class="footnote-ref" title="${note}">[${id}]</a>`;
    });

    // Links: [text](url)
    output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // 3. Restore all Math placeholders with rendered KaTeX
    output = restoreMath(output);

    return output;
  }

  return html;
}
