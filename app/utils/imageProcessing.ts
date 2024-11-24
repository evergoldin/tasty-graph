export function createStippledImage(
  imageData: ImageData,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): string {
  const { width, height, data } = imageData;
  
  // Clear canvas and set background to a light warm gray for softer contrast
  ctx.fillStyle = 'rgb(245, 242, 240)';
  ctx.fillRect(0, 0, width, height);
  
  // Convert to grayscale and detect edges
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * 4;
      
      // Get color values and desaturate them
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // Calculate brightness for density
      const brightness = (r + g + b) / (3 * 255);
      const density = 1 - brightness;
      
      // Desaturate colors
      const avg = (r + g + b) / 3;
      const desaturateAmount = 0.6; // Higher value means more desaturated
      const newR = Math.round(r * (1 - desaturateAmount) + avg * desaturateAmount);
      const newG = Math.round(g * (1 - desaturateAmount) + avg * desaturateAmount);
      const newB = Math.round(b * (1 - desaturateAmount) + avg * desaturateAmount);
      
      // Apply muted stippling with varying dot sizes
      if (Math.random() < density) {
        const dotSize = Math.max(0.5, density * 1.5); // Reduced max dot size
        
        // Create more transparent dots for softer effect
        const baseAlpha = 0.4; // Reduced base opacity
        const alpha = baseAlpha + (density * 0.3); // Vary opacity by density
        
        // Main dot
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${newR}, ${newG}, ${newB}, ${alpha})`;
        ctx.fill();
        
        // Smaller accent dot for detail in darker areas
        if (density > 0.6) {
          ctx.beginPath();
          ctx.arc(x, y, dotSize * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${newR}, ${newG}, ${newB}, ${alpha + 0.2})`;
          ctx.fill();
        }
      }
    }
  }
  
  // Apply a subtle muting overlay
  const originalImage = ctx.getImageData(0, 0, width, height);
  for (let i = 0; i < originalImage.data.length; i += 4) {
    const r = originalImage.data[i];
    const g = originalImage.data[i + 1];
    const b = originalImage.data[i + 2];
    const a = originalImage.data[i + 3];
    
    if (a > 0) {
      // Reduce contrast and add slight warmth
      const factor = 0.85; // Reduces contrast
      const warmth = 5; // Adds slight warmth to the image
      
      originalImage.data[i] = Math.min(255, r * factor + warmth);
      originalImage.data[i + 1] = Math.min(255, g * factor);
      originalImage.data[i + 2] = Math.min(255, b * factor);
      originalImage.data[i + 3] = Math.min(255, a * 0.95); // Slightly reduce overall opacity
    }
  }
  
  // Apply a final soft vignette effect
  ctx.putImageData(originalImage, 0, 0);
  ctx.fillStyle = 'rgba(245, 242, 240, 0.15)';
  const gradient = ctx.createRadialGradient(
    width/2, height/2, Math.min(width, height) * 0.3,
    width/2, height/2, Math.max(width, height) * 0.7
  );
  gradient.addColorStop(0, 'rgba(245, 242, 240, 0)');
  gradient.addColorStop(1, 'rgba(245, 242, 240, 0.3)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
}

export function analyzeImageContours(
  imageData: ImageData
): { edges: number[][], intensity: number[][], colors: { r: number, g: number, b: number }[][] } {
  const width = imageData.width;
  const height = imageData.height;
  const edges: number[][] = [];
  const intensity: number[][] = [];
  const colors: { r: number, g: number, b: number }[][] = [];
  
  // Sobel operators for edge detection
  const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
  const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
  
  for (let y = 1; y < height - 1; y++) {
    edges[y] = [];
    intensity[y] = [];
    colors[y] = [];
    
    for (let x = 1; x < width - 1; x++) {
      let pixelX = 0;
      let pixelY = 0;
      
      // Apply Sobel operators
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const idx = ((y + i) * width + (x + j)) * 4;
          const gray = (
            imageData.data[idx] + 
            imageData.data[idx + 1] + 
            imageData.data[idx + 2]
          ) / 3;
          
          pixelX += gray * sobelX[i + 1][j + 1];
          pixelY += gray * sobelY[i + 1][j + 1];
        }
      }
      
      // Calculate edge magnitude
      edges[y][x] = Math.sqrt(pixelX * pixelX + pixelY * pixelY);
      
      // Store color information
      const idx = (y * width + x) * 4;
      colors[y][x] = {
        r: imageData.data[idx],
        g: imageData.data[idx + 1],
        b: imageData.data[idx + 2]
      };
      
      // Calculate intensity
      intensity[y][x] = (
        imageData.data[idx] + 
        imageData.data[idx + 1] + 
        imageData.data[idx + 2]
      ) / 3;
    }
  }
  
  return { edges, intensity, colors };
} 