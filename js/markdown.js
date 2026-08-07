/**
 * A lightweight, custom Markdown-to-HTML parser designed for the Codex blog.
 * Supports standard formatting, blockquotes, lists, and custom footnotes/marginalia.
 */
export function parseMarkdown(markdown) {
  if (!markdown) return '';

  const lines = markdown.split('\n');
  let html = '';
  let inList = false;
  let inBlockquote = false;
  const footnotes = {};
  
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
      const match = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (match) {
        if (inList) { html += '</ul>\n'; inList = false; }
        if (inBlockquote) { html += '</blockquote>\n'; inBlockquote = false; }
        const alt = match[1];
        const src = match[2];
        html += `<figure class="article-figure"><img src="${src}" alt="${alt}" class="article-image" />${alt ? `<figcaption>${alt}</figcaption>` : ''}</figure>\n`;
        continue;
      }
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
    // Check if in blockquote or list and close if not matching
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

    // Bold: **text** or __text__
    output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    output = output.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // Italics: *text* or _text_
    output = output.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    output = output.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Inline code: `code`
    output = output.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Footnote references: [^1]
    output = output.replace(/\[\^([^\]]+)\]/g, (match, id) => {
      const note = footnotes[id] ? footnotes[id].replace(/"/g, '&quot;') : '';
      return `<a href="#fn-${id}" id="fnref-${id}" class="footnote-ref" title="${note}">${id}</a>` +
             `<span class="sidenote">${note}</span>`;
    });

    // Links: [text](url)
    output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    return output;
  }

  return html;
}
