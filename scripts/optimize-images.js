#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Recursively find all image files in a directory
 */
function findImageFiles(dir, extensions = ['.jpg', '.jpeg', '.png']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  traverse(dir);
  return files;
}

/**
 * Convert an image to WebP format with metadata stripped but color space preserved
 */
async function convertToWebP(inputPath, outputPath, quality = 85) {
  try {
    const inputBuffer = fs.readFileSync(inputPath);
    const outputBuffer = await sharp(inputBuffer)
      .webp({ 
        quality, 
        effort: 6,
        // Strip metadata (EXIF, ICC profiles, etc.) but preserve color space
        strip: true
      })
      .toBuffer();
    
    fs.writeFileSync(outputPath, outputBuffer);
    
    const originalSize = fs.statSync(inputPath).size;
    const newSize = outputBuffer.length;
    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);
    
    console.log(`✓ Converted: ${path.basename(inputPath)} → ${path.basename(outputPath)} (${savings}% smaller, metadata stripped)`);
    return { success: true, savings: parseFloat(savings) };
  } catch (error) {
    console.error(`✗ Failed to convert ${inputPath}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Copy source images to build directory
 */
function copySourceImages() {
  const staticDirs = [
    path.join(__dirname, '..', 'static'),
    path.join(__dirname, '..', '..', 'static'),
  ];
  const buildDir = path.join(__dirname, '..', 'build');
  
  console.log('📁 Copying source images to build directory...\n');
  
  function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) return;
    
    const items = fs.readdirSync(src);
    
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      const stat = fs.statSync(srcPath);
      
      if (stat.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        copyRecursive(srcPath, destPath);
      } else {
        const ext = path.extname(item).toLowerCase();
        // Only copy image files
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
  }
  
  try {
    const buildStaticDir = path.join(buildDir, 'static');
    for (const staticDir of staticDirs) {
      if (fs.existsSync(staticDir)) {
        copyRecursive(staticDir, buildStaticDir);
      }
    }
    console.log('✓ Source images copied to build directory');
  } catch (error) {
    console.error(`❌ Failed to copy source images:`, error.message);
  }
}

/**
 * Main optimization function - only optimizes images in build directory
 */
async function optimizeImages() {
  const buildDir = path.join(__dirname, '..', 'build');
  
  console.log('🖼️  Starting image optimization...\n');
  
  // First, copy source images to build directory
  copySourceImages();
  
  let totalSavings = 0;
  let convertedCount = 0;
  let failedCount = 0;
  
  // Find all image files in build directory
  const buildImages = findImageFiles(buildDir);
  
  if (buildImages.length === 0) {
    console.log('No images found to optimize in build directory.');
    return;
  }
  
  console.log(`Found ${buildImages.length} images to process:\n`);
  
  for (const imagePath of buildImages) {
    const ext = path.extname(imagePath).toLowerCase();
    const basename = path.basename(imagePath, ext);
    
    // Skip if already a .webp file
    if (ext === '.webp') {
      console.log(`⏭️  Skipping ${path.basename(imagePath)} (already WebP)`);
      continue;
    }
    
    // Create the WebP version in the same directory as the original
    const webpPath = path.join(path.dirname(imagePath), `${basename}.webp`);
    
    // Skip if WebP already exists and is newer
    if (fs.existsSync(webpPath)) {
      const originalTime = fs.statSync(imagePath).mtime;
      const webpTime = fs.statSync(webpPath).mtime;
      
      if (webpTime > originalTime) {
        console.log(`⏭️  Skipping ${path.basename(imagePath)} (WebP already exists and is newer)`);
        continue;
      }
    }
    
    const result = await convertToWebP(imagePath, webpPath);
    
    if (result.success) {
      convertedCount++;
      totalSavings += result.savings;
      
      // Replace the original file with the WebP version in build directory only
      try {
        fs.copyFileSync(webpPath, imagePath);
        console.log(`🔄 Replaced original with WebP: ${path.basename(imagePath)}`);
      } catch (error) {
        console.error(`❌ Failed to replace original file:`, error.message);
      }
    } else {
      failedCount++;
    }
  }
  
  console.log(`\n📊 Optimization Summary:`);
  console.log(`   • Converted: ${convertedCount} images`);
  console.log(`   • Failed: ${failedCount} images`);
  console.log(`   • Average savings: ${convertedCount > 0 ? (totalSavings / convertedCount).toFixed(1) : 0}%`);
  
  if (convertedCount > 0) {
    console.log(`\n✨ Image optimization complete! Build directory images optimized.`);
    console.log(`💡 Your existing image references will now serve optimized WebP files automatically.`);
  }
}

// Run the optimization
if (require.main === module) {
  optimizeImages().catch(console.error);
}

module.exports = { optimizeImages, convertToWebP, findImageFiles };
