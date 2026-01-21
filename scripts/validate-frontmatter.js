#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function findMarkdownFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'build') {
      findMarkdownFiles(filePath, fileList);
    } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function validateFrontMatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  if (!content.includes('---')) {
    return { valid: true };
  }

  const frontMatterStart = lines.findIndex(line => line.trim() === '---');
  if (frontMatterStart === -1) {
    return { valid: true };
  }

  const frontMatterEnd = lines.findIndex((line, index) => index > frontMatterStart && line.trim() === '---');
  if (frontMatterEnd === -1) {
    return { valid: true };
  }

  const frontMatterLines = lines.slice(frontMatterStart + 1, frontMatterEnd);
  const frontMatterText = frontMatterLines.join('\n');

  const fieldPattern = /^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.+)$/gm;
  const errors = [];
  let match;

  while ((match = fieldPattern.exec(frontMatterText)) !== null) {
    const fieldName = match[1];
    const fieldValue = match[2].trim();
    
    if (fieldValue.includes(':') && !fieldValue.startsWith('"') && !fieldValue.startsWith("'") && !fieldValue.startsWith('[') && !fieldValue.startsWith('{')) {
      const fieldLineIndex = frontMatterLines.findIndex(line => {
        const lineMatch = line.match(new RegExp(`^${fieldName}:`));
        return lineMatch && line.includes(':');
      });
      
      if (fieldLineIndex !== -1) {
        const lineNumber = frontMatterStart + fieldLineIndex + 2;
        const escapedValue = fieldValue.replace(/"/g, '\\"');
        
        errors.push({
          valid: false,
          file: path.relative(process.cwd(), filePath),
          line: lineNumber,
          field: fieldName,
          message: `${fieldName} field contains a colon and must be quoted. Found: ${match[0]}`,
          fix: `${fieldName}: "${escapedValue}"`,
        });
      }
    }
  }

  if (errors.length > 0) {
    return errors[0];
  }

  return { valid: true };
}

function main() {
  const docsDir = path.join(__dirname, '..', 'docs');
  
  if (!fs.existsSync(docsDir)) {
    const rootDocsDir = path.join(__dirname, '..', '..', 'docs');
    if (!fs.existsSync(rootDocsDir)) {
      console.error('Docs directory not found');
      process.exit(1);
    }
    return validateDirectory(rootDocsDir);
  }

  return validateDirectory(docsDir);
}

function validateDirectory(docsDir) {
  const markdownFiles = findMarkdownFiles(docsDir);
  const errors = [];

  markdownFiles.forEach((file) => {
    const result = validateFrontMatter(file);
    if (!result.valid) {
      errors.push(result);
    }
  });

  if (errors.length > 0) {
    console.error('\n❌ Front matter validation errors found:\n');
    errors.forEach((error) => {
      console.error(`  ${error.file}:${error.line}`);
      console.error(`    ${error.message}`);
      console.error(`    Suggested fix: ${error.fix}\n`);
    });
    process.exit(1);
  } else {
    console.log('✅ All front matter fields with colons are properly quoted');
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateFrontMatter, findMarkdownFiles };
