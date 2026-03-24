/**
 * Convert Markdown to HTML suitable for Blogger.
 * Handles: headings, bold, code blocks, inline code, tables, lists, paragraphs.
 */
export function markdownToHtml(md) {
  let html = md;

  // Code blocks (must be processed before other inline transformations)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<pre><code>${escaped}</code></pre>`;
  });

  // Headings
  html = html.replace(/^#### (.*$)/gm, "<h4>$1</h4>");
  html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>");

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");

  // Inline code
  html = html.replace(/`(.*?)`/g, "<code>$1</code>");

  // Tables
  html = html.replace(
    /(^\|.+\|$\n?)+/gm,
    (tableBlock) => {
      const rows = tableBlock.trim().split("\n");
      const htmlRows = rows
        .filter((row) => !/^\|[-| :]+\|$/.test(row)) // Skip separator rows
        .map((row, i) => {
          const cells = row
            .split("|")
            .filter((c) => c.trim())
            .map((c) => {
              const tag = i === 0 ? "th" : "td";
              return `<${tag}>${c.trim()}</${tag}>`;
            })
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("\n");
      return `<table border="1" cellpadding="5" cellspacing="0">\n${htmlRows}\n</table>`;
    }
  );

  // Unordered lists
  html = html.replace(
    /(^- .+$\n?)+/gm,
    (listBlock) => {
      const items = listBlock
        .trim()
        .split("\n")
        .map((line) => `<li>${line.replace(/^- /, "")}</li>`)
        .join("\n");
      return `<ul>\n${items}\n</ul>`;
    }
  );

  // Ordered lists
  html = html.replace(
    /(^\d+\. .+$\n?)+/gm,
    (listBlock) => {
      const items = listBlock
        .trim()
        .split("\n")
        .map((line) => `<li>${line.replace(/^\d+\. /, "")}</li>`)
        .join("\n");
      return `<ol>\n${items}\n</ol>`;
    }
  );

  // Paragraphs: convert double newlines to paragraph breaks
  // But not inside <pre>, <table>, <ul>, <ol> blocks
  const blocks = html.split(/\n\n+/);
  html = blocks
    .map((block) => {
      block = block.trim();
      if (!block) return "";
      // Don't wrap block-level elements
      if (
        block.startsWith("<h") ||
        block.startsWith("<pre") ||
        block.startsWith("<table") ||
        block.startsWith("<ul") ||
        block.startsWith("<ol")
      ) {
        return block;
      }
      // Convert single newlines to <br> within paragraphs
      return `<p>${block.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n\n");

  return html;
}
