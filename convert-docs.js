#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true,
});

// HTML template
const htmlTemplate = (title, content) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - workflow-os-mcp</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="../styles.css">
    <style>
        .markdown-content {
            max-width: none;
        }
        .markdown-content h1 { @apply text-3xl font-bold mb-6; }
        .markdown-content h2 { @apply text-2xl font-bold mb-4 mt-8; }
        .markdown-content h3 { @apply text-xl font-semibold mb-3 mt-6; }
        .markdown-content p { @apply mb-4; }
        .markdown-content ul { @apply mb-4 pl-6; }
        .markdown-content ol { @apply mb-4 pl-6; }
        .markdown-content li { @apply mb-2; }
        .markdown-content code { @apply bg-gray-100 px-2 py-1 rounded text-sm font-mono; }
        .markdown-content pre { @apply bg-gray-900 text-green-400 p-4 rounded-lg mb-4 overflow-x-auto; }
        .markdown-content pre code { @apply bg-transparent text-green-400 p-0; }
        .markdown-content blockquote { @apply border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-4; }
        .markdown-content table { @apply w-full border-collapse border border-gray-300 mb-4; }
        .markdown-content th, .markdown-content td { @apply border border-gray-300 px-4 py-2; }
        .markdown-content th { @apply bg-gray-100 font-semibold; }
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
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article class="bg-white rounded-lg shadow-sm p-8">
            <div class="markdown-content prose prose-lg max-w-none">
                ${content}
            </div>
        </article>
    </main>

    <script src="../script.js"></script>
</body>
</html>`;

// Files to convert
const files = [
    { src: 'HOW_TO_USE.md', dest: 'how-to-use.html', title: 'How to Use' },
    { src: 'README.md', dest: 'readme.html', title: 'README' },
    { src: 'docs/mcp-client-configuration.md', dest: 'docs/mcp-client-configuration.html', title: 'MCP Client Configuration' },
    { src: 'docs/deployment.md', dest: 'docs/deployment.html', title: 'Deployment Guide' },
    { src: 'docs/api-reference.md', dest: 'docs/api-reference.html', title: 'API Reference' },
    { src: 'docs/setup.md', dest: 'docs/setup.html', title: 'Setup Guide' },
];

function convertFile(file) {
    const srcPath = path.join(__dirname, file.src);
    const destPath = path.join(__dirname, 'landing-page', file.dest);

    // Ensure destination directory exists
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    // Read and convert markdown
    const markdown = fs.readFileSync(srcPath, 'utf8');
    const htmlContent = marked(markdown);
    const fullHtml = htmlTemplate(file.title, htmlContent);

    // Write HTML file
    fs.writeFileSync(destPath, fullHtml);
    console.log(`Converted ${file.src} to ${file.dest}`);
}

console.log('Converting markdown files to HTML...');
files.forEach(convertFile);
console.log('Conversion complete!');