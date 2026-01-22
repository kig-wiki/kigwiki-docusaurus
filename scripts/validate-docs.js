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

function findCategoryFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'build') {
      findCategoryFiles(filePath, fileList);
    } else if (file === '_category_.yml') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function parseFrontMatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  if (!content.includes('---')) {
    return null;
  }

  const frontMatterStart = lines.findIndex(line => line.trim() === '---');
  if (frontMatterStart === -1) {
    return null;
  }

  const frontMatterEnd = lines.findIndex((line, index) => index > frontMatterStart && line.trim() === '---');
  if (frontMatterEnd === -1) {
    return null;
  }

  const frontMatterLines = lines.slice(frontMatterStart + 1, frontMatterEnd);
  const frontMatterText = frontMatterLines.join('\n');
  const frontMatter = {};

  const fieldPattern = /^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.+)$/gm;
  let match;

  while ((match = fieldPattern.exec(frontMatterText)) !== null) {
    const fieldName = match[1];
    let fieldValue = match[2].trim();
    
    if (fieldValue.startsWith('"') && fieldValue.endsWith('"')) {
      fieldValue = fieldValue.slice(1, -1);
    } else if (fieldValue.startsWith("'") && fieldValue.endsWith("'")) {
      fieldValue = fieldValue.slice(1, -1);
    }
    
    frontMatter[fieldName] = {
      value: fieldValue,
      raw: match[2].trim(),
      line: frontMatterStart + frontMatterLines.findIndex(line => line.includes(match[0])) + 2
    };
  }

  return frontMatter;
}

function parseCategoryFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const category = {};

  lines.forEach((line, index) => {
    const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.+)$/);
    if (match) {
      const fieldName = match[1];
      let fieldValue = match[2].trim();
      
      if (fieldValue.startsWith('"') && fieldValue.endsWith('"')) {
        fieldValue = fieldValue.slice(1, -1);
      } else if (fieldValue.startsWith("'") && fieldValue.endsWith("'")) {
        fieldValue = fieldValue.slice(1, -1);
      }
      
      category[fieldName] = {
        value: fieldValue,
        raw: match[2].trim(),
        line: index + 1
      };
    }
  });

  return category;
}

function hasSpecialChars(str) {
  return /[^A-Za-z0-9\s\.\|]/.test(str);
}

function isQuoted(str) {
  return (str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"));
}

function getParentDirectory(filePath) {
  return path.dirname(path.dirname(filePath));
}

function getDirectoryForSidebar(filePath) {
  const dir = path.dirname(filePath);
  return dir;
}

function main() {
  let docsDir;
  
  if (process.env.DOCS_DIR) {
    docsDir = process.env.DOCS_DIR;
  } else if (process.argv[2]) {
    docsDir = process.argv[2];
  } else {
    const parentDocs = path.join(__dirname, '..', '..', 'docs');
    const dockerDocs = path.join(__dirname, '..', 'docs');
    
    if (fs.existsSync(dockerDocs)) {
      docsDir = dockerDocs;
    } else if (fs.existsSync(parentDocs)) {
      docsDir = parentDocs;
    } else {
      docsDir = parentDocs;
    }
  }
  
  if (!fs.existsSync(docsDir)) {
    console.error(`Docs directory not found: ${docsDir}`);
    console.error(`Tried: ${path.join(__dirname, '..', '..', 'docs')}`);
    console.error(`Tried: ${path.join(__dirname, '..', 'docs')}`);
    process.exit(1);
  }

  const markdownFiles = findMarkdownFiles(docsDir);
  const categoryFiles = findCategoryFiles(docsDir);
  const errors = [];
  const warnings = [];

  const ids = new Map();
  const slugs = new Map();
  const sidebarLabels = new Map();
  const sidebarPositions = new Map();

  markdownFiles.forEach((filePath) => {
    const frontMatter = parseFrontMatter(filePath);
    if (!frontMatter) {
      return;
    }

    const relPath = path.relative(docsDir, filePath);
    const dir = getDirectoryForSidebar(filePath);

    if (frontMatter.id) {
      const idValue = frontMatter.id.value;
      if (ids.has(idValue)) {
        errors.push({
          type: 'duplicate_id',
          file: relPath,
          line: frontMatter.id.line,
          value: idValue,
          existingFile: ids.get(idValue).file,
          existingLine: ids.get(idValue).line
        });
      } else {
        ids.set(idValue, { file: relPath, line: frontMatter.id.line });
      }
    }

    if (frontMatter.slug) {
      const slugValue = frontMatter.slug.value;
      if (slugs.has(slugValue)) {
        errors.push({
          type: 'duplicate_slug',
          file: relPath,
          line: frontMatter.slug.line,
          value: slugValue,
          existingFile: slugs.get(slugValue).file,
          existingLine: slugs.get(slugValue).line
        });
      } else {
        slugs.set(slugValue, { file: relPath, line: frontMatter.slug.line });
      }
    }

    if (frontMatter.sidebar_label) {
      const labelValue = frontMatter.sidebar_label.value;
      if (sidebarLabels.has(labelValue)) {
        errors.push({
          type: 'duplicate_sidebar_label',
          file: relPath,
          line: frontMatter.sidebar_label.line,
          value: labelValue,
          existingFile: sidebarLabels.get(labelValue).file,
          existingLine: sidebarLabels.get(labelValue).line
        });
      } else {
        sidebarLabels.set(labelValue, { file: relPath, line: frontMatter.sidebar_label.line });
      }
    }

    if (frontMatter.title) {
      const titleValue = frontMatter.title.value;
      if (hasSpecialChars(titleValue) && !isQuoted(frontMatter.title.raw)) {
        errors.push({
          type: 'unquoted_title',
          file: relPath,
          line: frontMatter.title.line,
          value: titleValue,
          raw: frontMatter.title.raw
        });
      }
    }

    if (frontMatter.description) {
      const descValue = frontMatter.description.value;
      if (hasSpecialChars(descValue) && !isQuoted(frontMatter.description.raw)) {
        errors.push({
          type: 'unquoted_description',
          file: relPath,
          line: frontMatter.description.line,
          value: descValue,
          raw: frontMatter.description.raw
        });
      }
    }

    if (frontMatter.sidebar_position) {
      const posValue = parseInt(frontMatter.sidebar_position.value);
      const key = `${dir}:${posValue}`;
      
      if (sidebarPositions.has(key)) {
        errors.push({
          type: 'duplicate_sidebar_position',
          file: relPath,
          line: frontMatter.sidebar_position.line,
          value: posValue,
          directory: dir,
          existingFile: sidebarPositions.get(key).file,
          existingLine: sidebarPositions.get(key).line
        });
      } else {
        sidebarPositions.set(key, { file: relPath, line: frontMatter.sidebar_position.line });
      }
    }
  });

  categoryFiles.forEach((filePath) => {
    const category = parseCategoryFile(filePath);
    if (!category.position) {
      return;
    }

    const relPath = path.relative(docsDir, filePath);
    const parentDir = getParentDirectory(filePath);
    const posValue = parseInt(category.position.value);
    const key = `${parentDir}:${posValue}`;

    if (sidebarPositions.has(key)) {
      errors.push({
        type: 'duplicate_sidebar_position',
        file: relPath,
        line: category.position.line,
        value: posValue,
        directory: parentDir,
        existingFile: sidebarPositions.get(key).file,
        existingLine: sidebarPositions.get(key).line
      });
    } else {
      sidebarPositions.set(key, { file: relPath, line: category.position.line });
    }
  });

  if (errors.length > 0) {
    console.error('\n❌ Documentation validation errors found:\n');
    
    errors.forEach((error) => {
      switch (error.type) {
        case 'duplicate_id':
          console.error(`  ❌ Duplicate ID: "${error.value}"`);
          console.error(`     Found in: ${error.file}:${error.line}`);
          console.error(`     Already exists in: ${error.existingFile}:${error.existingLine}\n`);
          break;
        case 'duplicate_slug':
          console.error(`  ❌ Duplicate slug: "${error.value}"`);
          console.error(`     Found in: ${error.file}:${error.line}`);
          console.error(`     Already exists in: ${error.existingFile}:${error.existingLine}\n`);
          break;
        case 'duplicate_sidebar_label':
          console.error(`  ❌ Duplicate sidebar_label: "${error.value}"`);
          console.error(`     Found in: ${error.file}:${error.line}`);
          console.error(`     Already exists in: ${error.existingFile}:${error.existingLine}\n`);
          break;
        case 'unquoted_title':
          console.error(`  ❌ Title contains special characters but is not quoted:`);
          console.error(`     File: ${error.file}:${error.line}`);
          console.error(`     Current: ${error.raw}`);
          console.error(`     Should be: "${error.value}"\n`);
          break;
        case 'unquoted_description':
          console.error(`  ❌ Description contains special characters but is not quoted:`);
          console.error(`     File: ${error.file}:${error.line}`);
          console.error(`     Current: ${error.raw}`);
          console.error(`     Should be: "${error.value}"\n`);
          break;
        case 'duplicate_sidebar_position':
          console.error(`  ❌ Duplicate sidebar_position: ${error.value} in directory "${error.directory}"`);
          console.error(`     Found in: ${error.file}:${error.line}`);
          console.error(`     Already exists in: ${error.existingFile}:${error.existingLine}\n`);
          break;
      }
    });
    
    process.exit(1);
  } else {
    console.log('✅ All documentation validation checks passed!');
    console.log(`   - Checked ${markdownFiles.length} markdown files`);
    console.log(`   - Checked ${categoryFiles.length} category files`);
    console.log(`   - All IDs, slugs, and sidebar_labels are unique`);
    console.log(`   - All titles/descriptions with special characters are quoted`);
    console.log(`   - No duplicate sidebar positions found`);
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseFrontMatter, parseCategoryFile, findMarkdownFiles, findCategoryFiles };

