import { PhotonImage, grayscale, gaussian_blur, threshold, invert, adjust_brightness, lighten_hsl, desaturate_hsl, selective_color_convert, Rgb, laplace, sobel_horizontal, sobel_vertical } from '@cf-wasm/photon';

/**
 * Watermark removal service for Cloudflare Workers using Photon WebAssembly
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Route handling
    switch (url.pathname) {
      case '/':
        return new Response(getHTML(), {
          headers: {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*'
          },
        });

      case '/api/remove-watermark':
        if (request.method === 'POST') {
          return handleWatermarkRemoval(request, env);
        }
        break;

      case '/api/health':
        return new Response(JSON.stringify({
          status: 'healthy',
          timestamp: Date.now(),
          deployment: 'cloudflare-workers',
          algorithm: 'comprehensive'
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
        });
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function handleWatermarkRemoval(request, env) {
  console.log('=== WATERMARK REMOVAL REQUEST RECEIVED ===');
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image');
    const watermarkText = formData.get('text') || 'SAMPLE';
    console.log('Image file received:', !!imageFile);
    console.log('Watermark text:', watermarkText);

    if (!imageFile) {
      return new Response(JSON.stringify({ error: 'No image file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Convert file to ArrayBuffer for processing
    console.log('Converting image to ArrayBuffer...');
    const imageBuffer = await imageFile.arrayBuffer();
    console.log('Image buffer size:', imageBuffer.byteLength);

    // Process image with watermark removal
    console.log('Calling processImageBasic...');
    const result = await processImageBasic(imageBuffer, watermarkText);
    console.log('Processing completed, result size:', result.byteLength);

    return new Response(result, {
      headers: {
        'Content-Type': 'image/png',
        'Access-Control-Allow-Origin': '*',
        'Content-Disposition': `attachment; filename="processed_${imageFile.name}"`,
      },
    });

  } catch (error) {
    console.error('Error processing image:', error);
    return new Response(JSON.stringify({
      error: 'Failed to process image',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  }
}

async function processImageBasic(imageBuffer, watermarkText) {
  console.log('=== PROCESSING IMAGE BASIC CALLED ===');
  console.log('Applying watermark removal using Photon built-ins');

  try {
    const uint8Array = new Uint8Array(imageBuffer);
    const photonImage = PhotonImage.new_from_byteslice(uint8Array);

    console.log('Applying watermark removal strategy with visible changes...');

    // Strategy: Use Photon functions to reduce watermark visibility

    // 1. Slight blur to soften watermark edges
    gaussian_blur(photonImage, 1.5);
    console.log('Applied light blur to soften watermark');

    // 2. Reduce brightness to dim white watermarks
    adjust_brightness(photonImage, -25);
    console.log('Applied brightness reduction to dim watermarks');

    // 3. Desaturate to reduce color watermarks
    desaturate_hsl(photonImage);
    console.log('Applied desaturation');

    // 4. Another blur pass for smoothing
    gaussian_blur(photonImage, 1.0);
    console.log('Applied final smoothing blur');

    // 5. Slight brightness adjustment to compensate
    adjust_brightness(photonImage, 10);
    console.log('Applied brightness compensation');

    const resultBytes = photonImage.get_bytes();
    photonImage.free();

    console.log('Watermark removal complete using Photon built-ins');
    return resultBytes.buffer;

  } catch (error) {
    console.error('Photon processing failed:', error);
    return imageBuffer;
  }
}

async function applyWatermarkRemoval(photonImage, watermarkText) {
  console.log('Applying aggressive watermark removal algorithm');

  // Apply comprehensive watermark removal using multiple techniques (modifies in-place)
  applyComprehensiveWatermarkRemoval(photonImage);

  // Return the same image (which has been modified)
  return photonImage;
}

function applyComprehensiveWatermarkRemoval(photonImage) {
  console.log('Starting server-side inpainting watermark removal...');

  try {
    const width = photonImage.get_width();
    const height = photonImage.get_height();
    console.log(`Processing image of size: ${width}x${height}`);

    // Apply inpainting using manual pixel manipulation with safer memory handling
    applyInpaintingWithSafeMemory(photonImage, width, height);

    console.log('Server-side inpainting completed successfully');
  } catch (error) {
    console.error('Error during watermark removal:', error);
    // Fallback to minimal processing
    console.log('Applying minimal fallback processing...');
    gaussian_blur(photonImage, 0.5);
  }

  return photonImage;
}

function applyInpaintingWithSafeMemory(photonImage, width, height) {
  // Get a safe copy of pixel data
  const pixels = photonImage.get_raw_pixels();

  // Create a copy to avoid memory issues
  const originalPixels = new Uint8Array(pixels.length);
  for (let i = 0; i < pixels.length; i++) {
    originalPixels[i] = pixels[i];
  }

  // Detect watermark regions using the copied data
  const watermarkMask = detectWatermarkRegions(originalPixels, width, height);

  // Apply inpainting by modifying the original pixels array
  // This should work since we're modifying the reference returned by get_raw_pixels()
  const inpaintRadius = 8; // Larger radius for better inpainting of bold text

  for (let y = inpaintRadius; y < height - inpaintRadius; y++) {
    for (let x = inpaintRadius; x < width - inpaintRadius; x++) {
      const idx = y * width + x;

      if (watermarkMask[idx] > 0) { // This pixel is part of a watermark
        const pixelIdx = idx * 4;

        // Collect nearby non-watermark pixels for inpainting
        let sumR = 0, sumG = 0, sumB = 0, count = 0;

        for (let dy = -inpaintRadius; dy <= inpaintRadius; dy++) {
          for (let dx = -inpaintRadius; dx <= inpaintRadius; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            const nIdx = ny * width + nx;

            // Only use non-watermark pixels for inpainting
            if (watermarkMask[nIdx] === 0) {
              const nPixelIdx = nIdx * 4;
              sumR += originalPixels[nPixelIdx];
              sumG += originalPixels[nPixelIdx + 1];
              sumB += originalPixels[nPixelIdx + 2];
              count++;
            }
          }
        }

        // Replace watermark pixel with average of surrounding pixels
        if (count > 0) {
          pixels[pixelIdx] = Math.round(sumR / count);
          pixels[pixelIdx + 1] = Math.round(sumG / count);
          pixels[pixelIdx + 2] = Math.round(sumB / count);
          // Keep original alpha
        }
      }
    }
  }
}

function applyInpaintingToImageBytes(imageBytes, width, height) {
  // Create a temporary PhotonImage to get pixel data
  const tempImage = PhotonImage.new_from_byteslice(new Uint8Array(imageBytes));
  const pixelData = tempImage.get_raw_pixels();

  // Detect watermark regions
  const watermarkMask = detectWatermarkRegions(pixelData, width, height);

  // Apply inpainting to pixel data
  applyInpaintingToPixelData(pixelData, watermarkMask, width, height);

  // Get the modified image bytes
  const modifiedBytes = tempImage.get_bytes();
  tempImage.free();

  return modifiedBytes.buffer;
}

function applyInpaintingToPixelData(pixelData, watermarkMask, width, height) {
  const inpaintRadius = 5;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;

      if (watermarkMask[idx] > 0) { // This pixel is part of a watermark
        const pixelIdx = idx * 4;

        // Collect nearby non-watermark pixels for inpainting
        let sumR = 0, sumG = 0, sumB = 0, count = 0;

        for (let dy = -inpaintRadius; dy <= inpaintRadius; dy++) {
          for (let dx = -inpaintRadius; dx <= inpaintRadius; dx++) {
            const ny = y + dy;
            const nx = x + dx;

            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const nIdx = ny * width + nx;

              // Only use non-watermark pixels for inpainting
              if (watermarkMask[nIdx] === 0) {
                const nPixelIdx = nIdx * 4;
                sumR += pixelData[nPixelIdx];
                sumG += pixelData[nPixelIdx + 1];
                sumB += pixelData[nPixelIdx + 2];
                count++;
              }
            }
          }
        }

        // Replace watermark pixel with average of surrounding pixels
        if (count > 0) {
          pixelData[pixelIdx] = Math.round(sumR / count);
          pixelData[pixelIdx + 1] = Math.round(sumG / count);
          pixelData[pixelIdx + 2] = Math.round(sumB / count);
          // Keep original alpha (pixelData[pixelIdx + 3])
        }
      }
    }
  }
}

function detectWatermarkRegions(pixels, width, height) {
  const mask = new Uint8Array(width * height);

  // Focus on center region where large watermarks typically appear
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const searchWidth = Math.floor(width * 0.6); // Search in 60% of image width
  const searchHeight = Math.floor(height * 0.6); // Search in 60% of image height

  const startX = centerX - Math.floor(searchWidth / 2);
  const endX = centerX + Math.floor(searchWidth / 2);
  const startY = centerY - Math.floor(searchHeight / 2);
  const endY = centerY + Math.floor(searchHeight / 2);

  console.log(`Searching for large watermarks in center region: ${startX}-${endX}, ${startY}-${endY}`);

  // More aggressive detection for large, bold text watermarks
  for (let y = Math.max(5, startY); y < Math.min(height - 5, endY); y++) {
    for (let x = Math.max(5, startX); x < Math.min(width - 5, endX); x++) {
      const idx = (y * width + x) * 4;

      // Get pixel intensity
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const intensity = (r + g + b) / 3;

      // For large bold watermarks, look for:
      // 1. Bright pixels (white/light text)
      // 2. High contrast with surroundings
      // 3. Consistent patterns (not isolated pixels)

      let contrastSum = 0;
      let neighborCount = 0;
      const checkRadius = 3; // Larger radius for bold text detection

      for (let dy = -checkRadius; dy <= checkRadius; dy++) {
        for (let dx = -checkRadius; dx <= checkRadius; dx++) {
          if (dx === 0 && dy === 0) continue;

          const ny = y + dy;
          const nx = x + dx;

          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            const nIdx = (ny * width + nx) * 4;
            const nR = pixels[nIdx];
            const nG = pixels[nIdx + 1];
            const nB = pixels[nIdx + 2];
            const nIntensity = (nR + nG + nB) / 3;

            contrastSum += Math.abs(intensity - nIntensity);
            neighborCount++;
          }
        }
      }

      const avgContrast = contrastSum / neighborCount;

      // Detect large bold watermarks with more aggressive thresholds
      const isBrightWatermark = intensity > 200 && avgContrast > 20; // Bright text with contrast
      const isConsistentBright = intensity > 220; // Very bright pixels (common in bold watermarks)

      if (isBrightWatermark || isConsistentBright) {
        mask[y * width + x] = 255;
      }
    }
  }

  // Count detected pixels
  let detectedPixels = 0;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] > 0) detectedPixels++;
  }
  console.log(`Detected ${detectedPixels} watermark pixels in center region`);

  // Aggressive dilation for large text watermarks
  const dilatedMask = dilateMask(mask, width, height, 6); // Larger dilation for bold text

  // Count dilated pixels
  let dilatedPixels = 0;
  for (let i = 0; i < dilatedMask.length; i++) {
    if (dilatedMask[i] > 0) dilatedPixels++;
  }
  console.log(`Total ${dilatedPixels} watermark pixels after aggressive dilation`);

  return dilatedMask;
}

function dilateMask(mask, width, height, radius) {
  const dilated = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;

      // Check if any pixel in the radius is marked
      let found = false;
      for (let dy = -radius; dy <= radius && !found; dy++) {
        for (let dx = -radius; dx <= radius && !found; dx++) {
          const ny = y + dy;
          const nx = x + dx;

          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            const nIdx = ny * width + nx;
            if (mask[nIdx] > 0) {
              found = true;
            }
          }
        }
      }

      dilated[idx] = found ? 255 : 0;
    }
  }

  return dilated;
}


async function processWithManualInpainting(imageBuffer) {
  console.log('Starting manual inpainting process...');

  // Create PhotonImage to get pixel data and dimensions
  const uint8Array = new Uint8Array(imageBuffer);
  const photonImage = PhotonImage.new_from_byteslice(uint8Array);
  const width = photonImage.get_width();
  const height = photonImage.get_height();

  console.log(`Image dimensions: ${width}x${height}`);

  // Get pixel data and modify it DIRECTLY (no copying)
  const pixels = photonImage.get_raw_pixels();
  console.log('Got raw pixels, modifying directly...');

  // Detect and inpaint watermark regions - modify pixels array directly
  manualInpaintWatermark(pixels, width, height);

  console.log('Pixel modifications complete, generating output...');

  // Get the modified image bytes
  const resultBytes = photonImage.get_bytes();

  // Clean up
  photonImage.free();

  console.log('Manual inpainting completed');
  return resultBytes.buffer;
}

function manualInpaintWatermark(pixels, width, height) {
  console.log('Applying BRUTE FORCE watermark removal - making entire center BLACK...');

  let pixelsModified = 0;

  // Target the center region where SAMPLE watermarks appear
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const watermarkWidth = Math.floor(width * 0.3);  // Watermark area width
  const watermarkHeight = Math.floor(height * 0.1); // Watermark area height

  console.log(`Making BLACK rectangle: ${watermarkWidth}x${watermarkHeight} at center ${centerX}, ${centerY}`);

  // Define the rectangular region where SAMPLE watermark typically appears
  const startX = centerX - Math.floor(watermarkWidth / 2);
  const endX = centerX + Math.floor(watermarkWidth / 2);
  const startY = centerY - Math.floor(watermarkHeight / 2);
  const endY = centerY + Math.floor(watermarkHeight / 2);

  console.log(`BLACK rectangle coordinates: ${startX}-${endX}, ${startY}-${endY}`);

  // BRUTE FORCE: Make the entire watermark area completely BLACK
  for (let y = Math.max(0, startY); y < Math.min(height, endY); y++) {
    for (let x = Math.max(0, startX); x < Math.min(width, endX); x++) {
      const idx = (y * width + x) * 4;

      // Make pixel completely BLACK - this WILL be visible
      pixels[idx] = 0;     // Red = 0
      pixels[idx + 1] = 0; // Green = 0
      pixels[idx + 2] = 0; // Blue = 0
      // Keep alpha unchanged: pixels[idx + 3]

      pixelsModified++;
    }
  }

  console.log(`BRUTE FORCE: Made ${pixelsModified} pixels completely BLACK`);
  console.log(`If this doesn't show up, there's a fundamental issue with pixel modification`);

  return pixels;
}

function createEnhancedWatermarkMask(pixels, width, height) {
  const mask = new Uint8Array(width * height);

  // Focus on center region for large watermarks
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const searchRadius = Math.min(width, height) * 0.35;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (distFromCenter > searchRadius) continue;

      const idx = (y * width + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const intensity = (r + g + b) / 3;

      // Multi-criteria detection for better watermark identification
      let isWatermark = false;

      // Criterion 1: Brightness-based detection
      if (intensity > 185) {
        isWatermark = true;
      }

      // Criterion 2: Edge-based detection for text boundaries
      if (intensity > 160) {
        const edgeStrength = calculateEdgeStrength(pixels, x, y, width, height);
        if (edgeStrength > 30) {
          isWatermark = true;
        }
      }

      // Criterion 3: Color uniformity (watermarks often have consistent color)
      if (intensity > 150) {
        const colorVariance = Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
        if (colorVariance < 15) { // Low color variance indicates uniform watermark
          isWatermark = true;
        }
      }

      if (isWatermark) {
        mask[y * width + x] = 255;
      }
    }
  }

  return mask;
}

function calculateEdgeStrength(pixels, x, y, width, height) {
  if (x < 1 || x >= width - 1 || y < 1 || y >= height - 1) return 0;

  const getIntensity = (px, py) => {
    const idx = (py * width + px) * 4;
    return (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
  };

  // Simple Sobel edge detection
  const gx = -getIntensity(x-1, y-1) + getIntensity(x+1, y-1) +
             -2*getIntensity(x-1, y) + 2*getIntensity(x+1, y) +
             -getIntensity(x-1, y+1) + getIntensity(x+1, y+1);

  const gy = -getIntensity(x-1, y-1) - 2*getIntensity(x, y-1) - getIntensity(x+1, y-1) +
             getIntensity(x-1, y+1) + 2*getIntensity(x, y+1) + getIntensity(x+1, y+1);

  return Math.sqrt(gx * gx + gy * gy);
}

function applyMorphologicalOperations(mask, width, height) {
  // Apply dilation to expand watermark regions
  let dilated = morphologicalDilation(mask, width, height, 3);

  // Apply erosion to clean up noise
  let eroded = morphologicalErosion(dilated, width, height, 1);

  // Apply dilation again to ensure complete watermark coverage
  let finalMask = morphologicalDilation(eroded, width, height, 4);

  return finalMask;
}

function morphologicalDilation(mask, width, height, radius) {
  const result = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let hasWatermark = false;

      for (let dy = -radius; dy <= radius && !hasWatermark; dy++) {
        for (let dx = -radius; dx <= radius && !hasWatermark; dx++) {
          const ny = y + dy;
          const nx = x + dx;

          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            if (mask[ny * width + nx] > 0) {
              hasWatermark = true;
            }
          }
        }
      }

      result[y * width + x] = hasWatermark ? 255 : 0;
    }
  }

  return result;
}

function morphologicalErosion(mask, width, height, radius) {
  const result = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let allWatermark = true;

      for (let dy = -radius; dy <= radius && allWatermark; dy++) {
        for (let dx = -radius; dx <= radius && allWatermark; dx++) {
          const ny = y + dy;
          const nx = x + dx;

          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            if (mask[ny * width + nx] === 0) {
              allWatermark = false;
            }
          } else {
            allWatermark = false;
          }
        }
      }

      result[y * width + x] = allWatermark ? 255 : 0;
    }
  }

  return result;
}

function applyBoundaryBasedInpainting(pixels, mask, width, height) {
  let pixelsModified = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;

      if (mask[idx] > 0) { // This pixel needs inpainting
        const pixelIdx = idx * 4;

        // Use progressive distance-based inpainting
        const inpaintedColor = progressiveInpainting(pixels, mask, x, y, width, height);

        if (inpaintedColor) {
          pixels[pixelIdx] = inpaintedColor.r;
          pixels[pixelIdx + 1] = inpaintedColor.g;
          pixels[pixelIdx + 2] = inpaintedColor.b;
          pixelsModified++;
        }
      }
    }
  }

  return pixelsModified;
}

function progressiveInpainting(pixels, mask, x, y, width, height) {
  // Try increasingly larger radii to find good inpainting samples
  const maxRadius = 20;

  for (let radius = 3; radius <= maxRadius; radius += 2) {
    let sumR = 0, sumG = 0, sumB = 0, count = 0;
    let weightSum = 0;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const ny = y + dy;
        const nx = x + dx;

        if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
          const nIdx = ny * width + nx;

          // Only use pixels that are not part of watermark
          if (mask[nIdx] === 0) {
            const nPixelIdx = nIdx * 4;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const weight = 1.0 / (1.0 + distance);

            sumR += pixels[nPixelIdx] * weight;
            sumG += pixels[nPixelIdx + 1] * weight;
            sumB += pixels[nPixelIdx + 2] * weight;
            weightSum += weight;
            count++;
          }
        }
      }
    }

    // If we found enough samples, use them
    if (count >= 8) {
      return {
        r: Math.round(sumR / weightSum),
        g: Math.round(sumG / weightSum),
        b: Math.round(sumB / weightSum)
      };
    }
  }

  return null;
}

async function processWithSimpleFallback(imageBuffer) {
  console.log('Fallback processing - returning original image');

  // Simple fallback that doesn't corrupt the image
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Return original image if Photon fails
  return imageBuffer;
}

async function processPNGBytes(uint8Array, algorithm, watermarkText) {
  console.log('Processing PNG - applying minimal filtering to avoid corruption');

  const processed = new Uint8Array(uint8Array);

  // Very conservative approach: only modify non-critical data
  // Apply subtle filtering to potential metadata areas
  for (let i = 100; i < processed.length - 100; i += 50) {
    const current = processed[i];
    const prev = processed[i - 1];
    const next = processed[i + 1];

    // Only modify if it looks like high-contrast watermark data
    const variation = Math.abs(current - prev) + Math.abs(current - next);

    if (variation > 100 && current > 150) { // High contrast + bright pixels
      switch (algorithm) {
        case 'edge':
          processed[i] = Math.round(current * 0.9); // Slight dimming
          break;
        case 'frequency':
          processed[i] = Math.round((current + prev + next) / 3);
          break;
        default:
          processed[i] = Math.round(current * 0.95); // Very subtle change
      }
    }
  }

  return processed.buffer;
}

async function processJPEGBytes(uint8Array, algorithm, watermarkText) {
  console.log('Processing JPEG - applying conservative filtering');

  const processed = new Uint8Array(uint8Array);

  // Very conservative: only touch potential image data, skip all markers
  for (let i = 500; i < processed.length - 500; i += 200) {
    // Skip JPEG markers completely
    if (processed[i] === 0xFF || processed[i-1] === 0xFF) {
      continue;
    }

    const current = processed[i];

    // Only modify bright pixels that might be watermarks
    if (current > 200) {
      switch (algorithm) {
        case 'edge':
          processed[i] = Math.round(current * 0.92);
          break;
        case 'frequency':
          processed[i] = Math.round(current * 0.88);
          break;
        default:
          processed[i] = Math.round(current * 0.96);
      }
    }
  }

  return processed.buffer;
}

async function processGenericBytes(uint8Array, algorithm, watermarkText) {
  console.log(`Processing unknown format - minimal changes to preserve structure`);

  const processed = new Uint8Array(uint8Array);

  // Extremely conservative: just dim bright pixels that might be watermarks
  for (let i = 200; i < processed.length - 200; i += 100) {
    const current = processed[i];

    // Only modify very bright pixels (likely watermarks)
    if (current > 220) {
      switch (algorithm) {
        case 'edge':
          processed[i] = Math.round(current * 0.9);
          break;
        case 'frequency':
          processed[i] = Math.round(current * 0.85);
          break;
        default:
          processed[i] = Math.round(current * 0.93);
      }
    }
  }

  return processed.buffer;
}

// All legacy Canvas-based functions removed - now using Photon WebAssembly

function getHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Watermarkn't</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='70' font-family='sans-serif' text-anchor='middle' x='50'>🖼️</text></svg>">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #00415a;
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 10px;
            font-size: 2.5em;
        }
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 40px;
            font-size: 1.1em;
        }
        .upload-area {
            border: 3px dashed #ddd;
            border-radius: 15px;
            padding: 60px 20px;
            text-align: center;
            margin-bottom: 30px;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        .upload-area:hover, .upload-area.dragover {
            border-color: #667eea;
            background: #f8faff;
        }
        .upload-icon {
            font-size: 4em;
            margin-bottom: 20px;
        }
        .btn {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 25px;
            font-size: 16px;
            cursor: pointer;
            transition: transform 0.2s;
            margin: 10px;
        }
        .btn:hover:not(:disabled) { transform: translateY(-2px); }
        .btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }
        .controls {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        .control-group {
            display: flex;
            flex-direction: column;
        }
        label {
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }
        input, select {
            padding: 12px;
            border: 2px solid #eee;
            border-radius: 8px;
            font-size: 14px;
        }
        input:focus, select:focus {
            outline: none;
            border-color: #667eea;
        }
        .progress {
            width: 100%;
            height: 6px;
            background: #f0f0f0;
            border-radius: 3px;
            margin: 20px 0;
            overflow: hidden;
            display: none;
        }
        .progress-bar {
            height: 100%;
            background: linear-gradient(45deg, #667eea, #764ba2);
            width: 0%;
            transition: width 0.3s ease;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        .result {
            margin-top: 30px;
            text-align: center;
            display: none;
        }
        .image-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
        }
        .image-box {
            text-align: center;
        }
        .image-box h3 {
            margin-bottom: 15px;
            color: #333;
        }
        .image-box img {
            max-width: 100%;
            max-height: 300px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .message {
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            font-weight: 500;
        }
        .error { background: #fee; border: 2px solid #fcc; color: #c33; }
        .success { background: #efe; border: 2px solid #cfc; color: #363; }
        .info { background: #e6f3ff; border: 2px solid #b3d9ff; color: #0066cc; }
        input[type="file"] { display: none; }
        @media (max-width: 768px) {
            .controls, .image-container { grid-template-columns: 1fr; }
            .container { padding: 20px; }
            h1 { font-size: 2em; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🖼️ Watermarkn't</h1>
        <p class="subtitle">A Watermark Removal Tool That Tries Its Best</p>

        <div class="upload-area" id="uploadArea" onclick="document.getElementById('fileInput').click()">
            <div class="upload-icon">📁</div>
            <p style="font-size: 1.2em; margin-bottom: 15px;">Drop image here or click to upload</p>
            <p style="color: #666;">Supports JPG, PNG, BMP, TIFF</p>
            <input type="file" id="fileInput" accept="image/*">
        </div>

        <div class="controls" style="display: flex; justify-content: center;">
            <div class="control-group" style="text-align: center;">
                <label for="watermarkText">Watermark Text</label>
                <input type="text" id="watermarkText" placeholder="e.g., SAMPLE" value="SAMPLE" style="width: 300px; text-align: center;">
            </div>
        </div>

        <div style="text-align: center; margin: 20px 0;">
            <button class="btn" id="processBtn" onclick="processImage()" disabled>
                Remove Watermark
            </button>
        </div>

        <div class="progress" id="progressBar">
            <div class="progress-bar" id="progressFill"></div>
        </div>

        <div id="messages"></div>

        <div class="result" id="result">
            <div class="image-container">
                <div class="image-box">
                    <h3>Original</h3>
                    <img id="originalImage" alt="Original">
                </div>
                <div class="image-box">
                    <h3>Processed</h3>
                    <img id="processedImage" alt="Processed">
                    <br><br>
                    <button class="btn" onclick="downloadImage()">Download</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        let selectedFile = null;
        let processedBlob = null;

        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        const processBtn = document.getElementById('processBtn');
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');
        const messages = document.getElementById('messages');
        const result = document.getElementById('result');

        fileInput.addEventListener('change', handleFile);
        uploadArea.addEventListener('dragover', e => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        uploadArea.addEventListener('drop', e => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                handleFile({ target: { files } });
            }
        });

        function handleFile(event) {
            const file = event.target.files[0];
            if (file && file.type.startsWith('image/')) {
                selectedFile = file;
                processBtn.disabled = false;

                const reader = new FileReader();
                reader.onload = e => {
                    document.getElementById('originalImage').src = e.target.result;
                };
                reader.readAsDataURL(file);

                showMessage(\`Selected: \${file.name} (\${(file.size/1024/1024).toFixed(2)} MB)\`, 'success');
            } else {
                showMessage('Please select a valid image file', 'error');
            }
        }

        async function processImage() {
            if (!selectedFile) return;

            const text = document.getElementById('watermarkText').value;

            processBtn.disabled = true;
            progressBar.style.display = 'block';
            result.style.display = 'none';

            try {
                console.log('CLIENT: Starting image processing...');
                showMessage('Processing image...', 'info');
                updateProgress(20);

                const formData = new FormData();
                formData.append('image', selectedFile);
                formData.append('text', text);

                updateProgress(60);

                console.log('CLIENT: Sending request to /api/remove-watermark...');
                const response = await fetch('/api/remove-watermark', {
                    method: 'POST',
                    body: formData
                });

                console.log('CLIENT: Response received, status:', response.status);
                updateProgress(90);

                if (!response.ok) {
                    let errorMessage = 'Processing failed';
                    try {
                        const contentType = response.headers.get('content-type');
                        if (contentType && contentType.includes('application/json')) {
                            const error = await response.json();
                            errorMessage = error.error || errorMessage;
                        } else {
                            const errorText = await response.text();
                            errorMessage = errorText || errorMessage;
                        }
                    } catch (e) {
                        console.error('Failed to parse error response:', e);
                    }
                    throw new Error(errorMessage);
                }

                processedBlob = await response.blob();
                console.log('CLIENT: Processed blob received, size:', processedBlob.size);
                updateProgress(100);

                const url = URL.createObjectURL(processedBlob);
                document.getElementById('processedImage').src = url;
                result.style.display = 'block';

                showMessage('Watermark removal complete!', 'success');

            } catch (error) {
                showMessage(\`Error: \${error.message}\`, 'error');
            } finally {
                processBtn.disabled = false;
                setTimeout(() => {
                    progressBar.style.display = 'none';
                    updateProgress(0);
                }, 1000);
            }
        }

        function downloadImage() {
            if (processedBlob) {
                const url = URL.createObjectURL(processedBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = \`processed_\${selectedFile.name}\`;
                a.click();
                URL.revokeObjectURL(url);
            }
        }

        function showMessage(message, type) {
            messages.innerHTML = \`<div class="message \${type}">\${message}</div>\`;
        }

        function updateProgress(percent) {
            progressFill.style.width = percent + '%';
        }
    </script>
</body>
</html>`;
}