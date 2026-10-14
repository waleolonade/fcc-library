/**
 * =========================================================================
 * FEDERAL CO-OPERATIVE COLLEGE, IBADAN
 * Smart Passport Processing Studio:
 * 1. Client-Side Background Removal (Perimeter Chroma Analysis & Alpha Feathering)
 * 2. Official FCC Crest Watermark & Security Seal Injection
 * =========================================================================
 */

/**
 * Calculates Euclidean color distance between two RGB pixels
 */
function colorDistance(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114);
}

/**
 * Loads an image from a File, Blob, or URL string
 */
export function loadImageSource(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image source: ' + err));

    if (typeof source === 'string') {
      img.src = source;
    } else if (source instanceof File || source instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    } else {
      reject(new Error('Unsupported image source type'));
    }
  });
}

/**
 * Process a passport photo:
 * - Detects and removes background
 * - Applies watermark with FCC Logo and official seal
 *
 * @param {File|Blob|string} source
 * @param {Object} options
 * @param {string} options.bgMode 'transparent' | 'studio-white' | 'studio-emerald'
 * @param {number} options.tolerance 20 to 60 (default 38)
 * @param {number} options.targetSize width/height (default 600)
 * @returns {Promise<{ dataUrl: string, blob: Blob }>}
 */
export async function processPassportPhoto(source, options = {}) {
  const {
    bgMode = 'transparent',
    tolerance = 38,
    targetSize = 600,
    watermarkOpacity = 0.40,
    includeSealText = true,
  } = options;

  const rawImg = await loadImageSource(source);

  // 1. Prepare Processing Canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Calculate center-crop aspect ratio for passport square
  const minDim = Math.min(rawImg.width, rawImg.height);
  const sx = (rawImg.width - minDim) / 2;
  const sy = (rawImg.height - minDim) / 2;

  // Draw source image to canvas
  ctx.drawImage(rawImg, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);

  // 2. Perform Intelligent Background Removal
  const imgData = ctx.getImageData(0, 0, targetSize, targetSize);
  const data = imgData.data;

  // Sample corners and top perimeter to determine dominant background color
  const samplePoints = [
    [4, 4], [targetSize - 4, 4], [Math.floor(targetSize / 2), 4],
    [8, 8], [targetSize - 8, 8],
    [4, Math.floor(targetSize * 0.25)], [targetSize - 4, Math.floor(targetSize * 0.25)],
    [4, Math.floor(targetSize * 0.4)], [targetSize - 4, Math.floor(targetSize * 0.4)]
  ];

  let sumR = 0, sumG = 0, sumB = 0, count = 0;
  for (const [px, py] of samplePoints) {
    const idx = (py * targetSize + px) * 4;
    sumR += data[idx];
    sumG += data[idx + 1];
    sumB += data[idx + 2];
    count++;
  }
  const bgR = Math.round(sumR / count);
  const bgG = Math.round(sumG / count);
  const bgB = Math.round(sumB / count);

  // Perimeter-based flood / distance mask
  // Pixels closer to corners/top are strictly background.
  // Center/lower portion (chest, face) is preserved.
  const cx = targetSize / 2;
  const cy = targetSize * 0.52; // slightly lower than center for head
  const maxRadius = targetSize * 0.42;

  for (let y = 0; y < targetSize; y++) {
    for (let x = 0; x < targetSize; x++) {
      const idx = (y * targetSize + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const dist = colorDistance(r, g, b, bgR, bgG, bgB);

      // Distance from passport face center
      const dx = x - cx;
      const dy = y - cy;
      const distFromCenter = Math.sqrt(dx * dx + dy * dy);

      // Protect inner face region unless it very strongly matches background
      const isInnerCore = distFromCenter < (maxRadius * 0.65) && (y > targetSize * 0.22 && y < targetSize * 0.82);

      if (!isInnerCore) {
        if (dist < tolerance) {
          // Full removal
          data[idx + 3] = 0;
        } else if (dist < tolerance + 16) {
          // Soft edge feathering
          const alphaRatio = (dist - tolerance) / 16;
          data[idx + 3] = Math.round(data[idx + 3] * alphaRatio);
        }
      }
    }
  }

  // Put background-removed pixels back
  ctx.putImageData(imgData, 0, 0);

  // 3. Composite Clean Background if requested (e.g. studio neutral / white)
  if (bgMode !== 'transparent') {
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = targetSize;
    bgCanvas.height = targetSize;
    const bgCtx = bgCanvas.getContext('2d');

    if (bgMode === 'studio-white') {
      const grad = bgCtx.createRadialGradient(cx, cy * 0.8, 40, cx, cy, targetSize * 0.7);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#f1f5f9');
      bgCtx.fillStyle = grad;
    } else if (bgMode === 'studio-emerald') {
      const grad = bgCtx.createRadialGradient(cx, cy * 0.8, 50, cx, cy, targetSize * 0.7);
      grad.addColorStop(0, '#ecfdf5');
      grad.addColorStop(1, '#d1fae5');
      bgCtx.fillStyle = grad;
    }
    bgCtx.fillRect(0, 0, targetSize, targetSize);
    bgCtx.drawImage(canvas, 0, 0);

    // Swap context to composite
    ctx.clearRect(0, 0, targetSize, targetSize);
    ctx.drawImage(bgCanvas, 0, 0);
  }

  // 4. Load & Apply Official FCC Watermark
  try {
    const logoImg = await loadImageSource('/assets/fcc-logo.png');
    ctx.save();

    // Draw Watermark in Bottom-Right / Center-Right
    const wmSize = targetSize * 0.28; // ~168px
    const wmX = targetSize - wmSize - 20;
    const wmY = targetSize - wmSize - 20;

    // Soft opacity for watermark
    ctx.globalAlpha = watermarkOpacity;
    ctx.drawImage(logoImg, wmX, wmY, wmSize, wmSize);

    // Optional Micro-Seal Text
    if (includeSealText) {
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = '#065f46'; // emerald-800
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('FCC IBADAN • VERIFIED PASSPORT', targetSize - 16, targetSize - 12);

      // Subtle border stamp around watermark area
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 1;
      ctx.strokeRect(wmX - 4, wmY - 4, wmSize + 8, wmSize + 8);
    }

    ctx.restore();
  } catch (wmErr) {
    console.warn('Could not load /assets/fcc-logo.png for watermark, using fallback seal text:', wmErr);
    ctx.save();
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('✓ FCC OFFICIAL PASSPORT', targetSize - 16, targetSize - 16);
    ctx.restore();
  }

  // 5. Export as High-Resolution Data URL & Blob
  const dataUrl = canvas.toDataURL('image/png', 0.95);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));

  return {
    dataUrl,
    blob,
    width: targetSize,
    height: targetSize,
  };
}
