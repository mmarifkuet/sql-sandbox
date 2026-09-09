let editor;

window.addEventListener('DOMContentLoaded', () => {
  editor = CodeMirror.fromTextArea(document.getElementById('markdownInput'), {
    mode: 'markdown',
    theme: 'dracula',
    lineNumbers: true,
    lineWrapping: true
  });

  // Render initially and on content change
  renderMarkdown();
  editor.on('change', renderMarkdown);
});

function renderMarkdown() {
  const rawMarkdown = editor.getValue();
  const parsedHTML = marked.parse(rawMarkdown);
  document.getElementById('preview').innerHTML = parsedHTML;
}

function exportMarkdown() {
  const content = editor.getValue();
  const blob = new Blob([content], { type: 'text/markdown' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'document.md';
  link.click();
}

function exportHTML() {
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Exported Markdown</title>
  <style>
    body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #333; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 5px; }
    code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  ${document.getElementById('preview').innerHTML}
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'document.html';
  link.click();
}