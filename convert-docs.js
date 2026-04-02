#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure markdown-it with plugins
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const highlighted = hljs.highlight(str, { language: lang }).value;
        return `<pre class="hljs"><code class="hljs language-${lang}">${highlighted}</code></pre>`;
      } catch (__) {}
    }
    return `<pre class="hljs"><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`;
  },
});

// Add additional plugins for better markdown support
// Note: In a real enterprise setup, you'd add more plugins like:
// - markdown-it-anchor for header anchors
// - markdown-it-table-of-contents
// - markdown-it-task-lists
// - markdown-it-footnote

// HTML template with GitHub-style markdown CSS
const htmlTemplate = (title, content) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - workflow-os-mcp</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github.min.css">
    <link rel="stylesheet" href="../styles.css">
    <style>
        /* GitHub-style markdown CSS */
        .markdown-body {
            -ms-text-size-adjust: 100%;
            -webkit-text-size-adjust: 100%;
            margin: 0;
            color: #24292f;
            background-color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
            font-size: 16px;
            line-height: 1.5;
            word-wrap: break-word;
        }

        .markdown-body .octicon {
            display: inline-block;
            fill: currentColor;
            vertical-align: text-bottom;
        }

        .markdown-body h1:hover .anchor .octicon-link:before,
        .markdown-body h2:hover .anchor .octicon-link:before,
        .markdown-body h3:hover .anchor .octicon-link:before,
        .markdown-body h4:hover .anchor .octicon-link:before,
        .markdown-body h5:hover .anchor .octicon-link:before,
        .markdown-body h6:hover .anchor .octicon-link:before {
            width: 16px;
            height: 16px;
            content: " ";
            display: inline-block;
            background-color: currentColor;
            -webkit-mask-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' version='1.1' aria-hidden='true'><path fill-rule='evenodd' d='m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a2.002 2.002 0 0 0 2.83 2.83Z'></path></svg>");
            mask-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' version='1.1' aria-hidden='true'><path fill-rule='evenodd' d='m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a2.002 2.002 0 0 0 2.83 2.83Z'></path></svg>");
        }

        .markdown-body details,
        .markdown-body figcaption,
        .markdown-body figure {
            display: block;
        }

        .markdown-body summary {
            display: list-item;
        }

        .markdown-body [hidden] {
            display: none !important;
        }

        .markdown-body a {
            background-color: transparent;
            color: #0969da;
            text-decoration: none;
        }

        .markdown-body a:active,
        .markdown-body a:hover {
            outline-width: 0;
        }

        .markdown-body abbr[title] {
            border-bottom: none;
            text-decoration: underline dotted;
        }

        .markdown-body b,
        .markdown-body strong {
            font-weight: 600;
        }

        .markdown-body dfn {
            font-style: italic;
        }

        .markdown-body h1 {
            margin: .67em 0;
            font-weight: 600;
            padding-bottom: .3em;
            font-size: 2em;
            border-bottom: 1px solid #d1d9e0;
        }

        .markdown-body mark {
            background-color: #fff3cd;
            color: #24292f;
        }

        .markdown-body small {
            font-size: 90%;
        }

        .markdown-body sub,
        .markdown-body sup {
            font-size: 75%;
            line-height: 0;
            position: relative;
            vertical-align: baseline;
        }

        .markdown-body sub {
            bottom: -0.25em;
        }

        .markdown-body sup {
            top: -0.5em;
        }

        .markdown-body img {
            border-style: none;
            max-width: 100%;
            box-sizing: content-box;
            background-color: #ffffff;
        }

        .markdown-body code,
        .markdown-body kbd,
        .markdown-body pre,
        .markdown-body samp {
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
            font-size: 12px;
        }

        .markdown-body figure {
            margin: 1em 40px;
        }

        .markdown-body hr {
            box-sizing: content-box;
            overflow: hidden;
            background: transparent;
            border-bottom: 1px solid #d1d9e0;
            height: .25em;
            padding: 0;
            margin: 24px 0;
            background-color: #d1d9e0;
            border: 0;
        }

        .markdown-body input {
            font: inherit;
            margin: 0;
            overflow: visible;
            font-family: inherit;
            font-size: inherit;
            line-height: inherit;
        }

        .markdown-body [type=button],
        .markdown-body [type=reset],
        .markdown-body [type=submit] {
            -webkit-appearance: button;
        }

        .markdown-body [type=button]::-moz-focus-inner,
        .markdown-body [type=reset]::-moz-focus-inner,
        .markdown-body [type=submit]::-moz-focus-inner {
            border-style: none;
            padding: 0;
        }

        .markdown-body [type=checkbox],
        .markdown-body [type=radio] {
            box-sizing: border-box;
            padding: 0;
        }

        .markdown-body [type=number]::-webkit-inner-spin-button,
        .markdown-body [type=number]::-webkit-outer-spin-button {
            height: auto;
        }

        .markdown-body [type=search] {
            -webkit-appearance: textfield;
            outline-offset: -2px;
        }

        .markdown-body [type=search]::-webkit-search-cancel-button,
        .markdown-body [type=search]::-webkit-search-decoration {
            -webkit-appearance: none;
        }

        .markdown-body ::-webkit-input-placeholder {
            color: inherit;
            opacity: .54;
        }

        .markdown-body ::-webkit-file-upload-button {
            -webkit-appearance: button;
            font: inherit;
        }

        .markdown-body a:hover {
            text-decoration: underline;
        }

        .markdown-body hr::before {
            display: table;
            content: "";
        }

        .markdown-body hr::after {
            display: table;
            clear: both;
            content: "";
        }

        .markdown-body table {
            border-spacing: 0;
            border-collapse: collapse;
            display: block;
            width: max-content;
            max-width: 100%;
            overflow: auto;
        }

        .markdown-body td,
        .markdown-body th {
            padding: 0;
        }

        .markdown-body details summary {
            cursor: pointer;
        }

        .markdown-body details:not([open])>*:not(summary) {
            display: none !important;
        }

        .markdown-body kbd {
            display: inline-block;
            padding: 3px 5px;
            font: 11px ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
            line-height: 10px;
            color: #24292f;
            vertical-align: middle;
            background-color: #f6f8fa;
            border: solid 1px #d1d9e0;
            border-bottom-color: #c7ccd1;
            border-radius: 6px;
            box-shadow: inset 0 -1px 0 #c7ccd1;
        }

        .markdown-body h1,
        .markdown-body h2,
        .markdown-body h3,
        .markdown-body h4,
        .markdown-body h5,
        .markdown-body h6 {
            margin-top: 24px;
            margin-bottom: 16px;
            font-weight: 600;
            line-height: 1.25;
        }

        .markdown-body h2 {
            font-size: 1.5em;
            padding-bottom: .3em;
            border-bottom: 1px solid #d1d9e0;
        }

        .markdown-body h3 {
            font-size: 1.25em;
        }

        .markdown-body h4 {
            font-size: 1em;
        }

        .markdown-body h5 {
            font-size: .875em;
        }

        .markdown-body h6 {
            font-size: .85em;
            color: #656d76;
        }

        .markdown-body p {
            margin-top: 0;
            margin-bottom: 10px;
        }

        .markdown-body blockquote {
            margin: 0 0 16px 0;
            padding: 0 1em;
            color: #656d76;
            border-left: .25em solid #d1d9e0;
        }

        .markdown-body ul,
        .markdown-body ol {
            margin-top: 0;
            margin-bottom: 0;
            padding-left: 2em;
        }

        .markdown-body ol ol,
        .markdown-body ul ol {
            list-style-type: lower-roman;
        }

        .markdown-body ul ul ol,
        .markdown-body ul ol ol,
        .markdown-body ol ul ol,
        .markdown-body ol ol ol {
            list-style-type: lower-alpha;
        }

        .markdown-body dd {
            margin-left: 0;
        }

        .markdown-body tt,
        .markdown-body code {
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
            font-size: 12px;
            background-color: #f6f8fa;
            border-radius: 6px;
            padding: .2em .4em;
        }

        .markdown-body pre {
            margin-top: 0;
            margin-bottom: 0;
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
            font-size: 12px;
            word-wrap: normal;
            padding: 16px;
            overflow: auto;
            background-color: #f6f8fa;
            border-radius: 6px;
            line-height: 1.45;
        }

        .markdown-body .highlight {
            margin-bottom: 16px;
        }

        .markdown-body .highlight pre {
            margin-bottom: 0;
            word-break: normal;
        }

        .markdown-body .highlight pre,
        .markdown-body pre {
            padding: 16px;
            overflow: auto;
            font-size: 85%;
            line-height: 1.45;
            background-color: #f6f8fa;
            border-radius: 6px;
        }

        .markdown-body pre code {
            display: inline;
            max-width: auto;
            padding: 0;
            margin: 0;
            overflow: visible;
            line-height: inherit;
            word-wrap: normal;
            background-color: transparent;
            border: 0;
        }

        .markdown-body .csv-data td,
        .markdown-body .csv-data th {
            padding: 5px;
            overflow: hidden;
            font-size: 12px;
            line-height: 1;
            text-align: left;
            white-space: nowrap;
        }

        .markdown-body .csv-data .blob-num {
            padding: 10px 8px 9px;
            text-align: right;
            background: #ffffff;
            border: 0;
        }

        .markdown-body .csv-data tr {
            border-top: 0;
        }

        .markdown-body .csv-data th {
            font-weight: 600;
            background: #f6f8fa;
            border-top: 0;
        }

        .markdown-body [data-footnote-ref]::before {
            content: "[";
        }

        .markdown-body [data-footnote-ref]::after {
            content: "]";
        }

        .markdown-body .footnotes {
            font-size: 12px;
            color: #656d76;
            border-top: 1px solid #d1d9e0;
        }

        .markdown-body .footnotes ol {
            padding-left: 16px;
        }

        .markdown-body .footnotes li {
            position: relative;
        }

        .markdown-body .footnotes li:target::before {
            position: absolute;
            top: -8px;
            right: -8px;
            bottom: -8px;
            left: -24px;
            pointer-events: none;
            content: "";
            border: 2px solid #0969da;
            border-radius: 6px;
        }

        .markdown-body .footnotes li:target {
            color: #24292f;
        }

        .markdown-body .footnotes .data-footnote-backref g-emoji {
            font-family: monospace;
        }

        .markdown-body .task-list-item {
            list-style-type: none;
        }

        .markdown-body .task-list-item label {
            font-weight: 400;
        }

        .markdown-body .task-list-item.enabled label {
            cursor: pointer;
        }

        .markdown-body .task-list-item+.task-list-item {
            margin-top: 3px;
        }

        .markdown-body .task-list-item .handle {
            display: none;
        }

        .markdown-body .task-list-item-checkbox {
            margin: 0 .2em .25em -1.6em;
            vertical-align: middle;
        }

        .markdown-body .contains-task-list:dir(rtl) .task-list-item-checkbox {
            margin: 0 -1.6em .25em .2em;
        }

        .markdown-body ::-webkit-calendar-picker-indicator {
            filter: invert(50%);
        }

        /* Custom container for our markdown content */
        .markdown-container {
            max-width: 100%;
            margin: 0 auto;
        }

        .markdown-body {
            box-sizing: border-box;
            min-width: 200px;
            max-width: none;
            margin: 0 auto;
            padding: 45px;
        }

        @media (max-width: 767px) {
            .markdown-body {
                padding: 15px;
            }
        }
    </style>
</head>
<body class="bg-gray-50 text-gray-900">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-4">
                <div class="flex items-center">
                    <a href="../index.html" class="text-2xl font-bold text-gray-900">workflow-os-mcp</a>
                </div>
                <div class="flex space-x-4">
                    <a href="../index.html" class="text-gray-600 hover:text-gray-900">← Back to Landing Page</a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Content -->
    <main class="markdown-container">
        <article class="markdown-body">
            ${content}
        </article>
    </main>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js"></script>
    <script>hljs.highlightAll();</script>
    <script src="../script.js"></script>
</body>
</html>`;

// Files to convert
const files = [
  { src: 'HOW_TO_USE.md', dest: 'how-to-use.html', title: 'How to Use' },
  { src: 'README.md', dest: 'readme.html', title: 'README' },
  {
    src: 'docs/mcp-client-configuration.md',
    dest: 'docs/mcp-client-configuration.html',
    title: 'MCP Client Configuration',
  },
  { src: 'docs/deployment.md', dest: 'docs/deployment.html', title: 'Deployment Guide' },
  { src: 'docs/api-reference.md', dest: 'docs/api-reference.html', title: 'API Reference' },
  { src: 'docs/setup.md', dest: 'docs/setup.html', title: 'Setup Guide' },
  { src: 'docs/claude-desktop.md', dest: 'docs/claude-desktop.html', title: 'Claude Desktop Integration' },
];

function convertFile(file) {
  const srcPath = path.join(__dirname, file.src);
  const destPath = path.join(__dirname, 'landing-page', file.dest);

  // Ensure destination directory exists
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Read and convert markdown using markdown-it
  const markdown = fs.readFileSync(srcPath, 'utf8');
  const htmlContent = md.render(markdown);
  const fullHtml = htmlTemplate(file.title, htmlContent);

  // Write HTML file
  fs.writeFileSync(destPath, fullHtml);
  console.log(`Converted ${file.src} to ${file.dest}`);
}

console.log('Converting markdown files to HTML...');
files.forEach(convertFile);
console.log('Conversion complete!');
