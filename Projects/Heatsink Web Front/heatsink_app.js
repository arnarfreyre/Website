// React application for Heatsink Temperature Simulation
// Includes visualization components, UI controls, and rendering logic

const { useState, useEffect, useCallback, useRef } = React;
const { createPortal } = ReactDOM;

// Jet colormap
function getColor(value, min, max) {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min + 0.001)));
  let r, g, b;

  if (t < 0.25) {
    r = 0; g = 4 * t; b = 1;
  } else if (t < 0.5) {
    r = 0; g = 1; b = 1 - 4 * (t - 0.25);
  } else if (t < 0.75) {
    r = 4 * (t - 0.5); g = 1; b = 0;
  } else {
    r = 1; g = 1 - 4 * (t - 0.75); b = 0;
  }

  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function getColorStr(value, min, max) {
  const c = getColor(value, min, max);
  return `rgb(${c.r}, ${c.g}, ${c.b})`;
}

// 3D Canvas rendering function (shared between inline and fullscreen)
function render3DCanvas(canvas, solution, Lx, Ly, gridSize, rotation, isFullscreen = false) {
  if (!solution || !canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const { T2D, Tmin, Tmax } = solution;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  const step = Math.max(1, Math.floor(gridSize / (isFullscreen ? 60 : 30)));
  // Reduced scale to prevent clipping
  const baseScale = isFullscreen ? 45 : 60;
  const scale = baseScale * Math.min(width / 400, height / 350);
  const zScale = 2.5;
  const centerX = width / 2;
  const centerY = height / 2 + (isFullscreen ? 30 : 30);

  // Only rotate around Z axis (azimuth), keep T axis always pointing up
  const azimuth = (rotation.z * Math.PI) / 180;
  // Elevation angle - how much we look down at the surface (fixed positive value)
  const elevation = (30 * Math.PI) / 180;

  // Isometric-style projection with T always pointing up
  const project = (x, y, z) => {
    // Rotate x,y plane around vertical axis (azimuth)
    const x1 = x * Math.cos(azimuth) - y * Math.sin(azimuth);
    const y1 = x * Math.sin(azimuth) + y * Math.cos(azimuth);

    // Project with fixed elevation - y1 goes into depth, z goes UP (positive z = higher on screen)
    const screenX = x1;
    const screenY = z + y1 * Math.sin(elevation);  // z goes up (positive)
    const depth = y1 * Math.cos(elevation);

    return {
      x: centerX + screenX * scale,
      y: centerY - screenY * scale * 0.9,  // minus because screen Y is inverted
      z: depth
    };
  };

  const faces = [];
  const m = T2D.length;
  const n = T2D[0].length;

  for (let i = 0; i < m - step; i += step) {
    for (let j = 0; j < n - step; j += step) {
      const x0 = (j / (n - 1)) * Lx - Lx / 2;
      const x1 = ((j + step) / (n - 1)) * Lx - Lx / 2;
      const y0 = (i / (m - 1)) * Ly - Ly / 2;
      const y1 = ((i + step) / (m - 1)) * Ly - Ly / 2;

      const z00 = (T2D[i][j] - Tmin) / (Tmax - Tmin + 0.001) * zScale;
      const z10 = (T2D[i][Math.min(j + step, n - 1)] - Tmin) / (Tmax - Tmin + 0.001) * zScale;
      const z01 = (T2D[Math.min(i + step, m - 1)][j] - Tmin) / (Tmax - Tmin + 0.001) * zScale;
      const z11 = (T2D[Math.min(i + step, m - 1)][Math.min(j + step, n - 1)] - Tmin) / (Tmax - Tmin + 0.001) * zScale;

      const avgTemp = (T2D[i][j] + T2D[i][Math.min(j + step, n - 1)] +
                     T2D[Math.min(i + step, m - 1)][j] +
                     T2D[Math.min(i + step, m - 1)][Math.min(j + step, n - 1)]) / 4;

      const p00 = project(x0, y0, z00);
      const p10 = project(x1, y0, z10);
      const p01 = project(x0, y1, z01);
      const p11 = project(x1, y1, z11);

      const avgZ = (p00.z + p10.z + p01.z + p11.z) / 4;

      faces.push({
        points: [p00, p10, p11, p01],
        z: avgZ,
        color: getColor(avgTemp, Tmin, Tmax)
      });
    }
  }

  faces.sort((a, b) => a.z - b.z);

  faces.forEach(face => {
    ctx.beginPath();
    ctx.moveTo(face.points[0].x, face.points[0].y);
    for (let i = 1; i < face.points.length; i++) {
      ctx.lineTo(face.points[i].x, face.points[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = `rgb(${face.color.r}, ${face.color.g}, ${face.color.b})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${face.color.r}, ${face.color.g}, ${face.color.b}, 0.5)`;
    ctx.lineWidth = isFullscreen ? 0.3 : 0.5;
    ctx.stroke();
  });

  // Draw axes from corner of domain
  const axisOrigin = project(-Lx/2, -Ly/2, 0);
  const xAxisEnd = project(Lx/2 + 0.3, -Ly/2, 0);
  const yAxisEnd = project(-Lx/2, Ly/2 + 0.3, 0);
  const zAxisEnd = project(-Lx/2, -Ly/2, zScale + 0.5);

  const axisLineWidth = isFullscreen ? 2.5 : 2;
  const fontSize = isFullscreen ? 14 : 11;
  const smallFontSize = isFullscreen ? 11 : 9;

  // X axis (red)
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = axisLineWidth;
  ctx.beginPath();
  ctx.moveTo(axisOrigin.x, axisOrigin.y);
  ctx.lineTo(xAxisEnd.x, xAxisEnd.y);
  ctx.stroke();

  // Y axis (green)
  ctx.strokeStyle = '#22c55e';
  ctx.beginPath();
  ctx.moveTo(axisOrigin.x, axisOrigin.y);
  ctx.lineTo(yAxisEnd.x, yAxisEnd.y);
  ctx.stroke();

  // T axis (blue) - vertical
  ctx.strokeStyle = '#3b82f6';
  ctx.beginPath();
  ctx.moveTo(axisOrigin.x, axisOrigin.y);
  ctx.lineTo(zAxisEnd.x, zAxisEnd.y);
  ctx.stroke();

  // Axis labels with values
  ctx.font = `bold ${fontSize}px JetBrains Mono`;

  // X axis label
  ctx.fillStyle = '#ef4444';
  ctx.fillText(`x (${Lx} cm)`, xAxisEnd.x + 8, xAxisEnd.y + 4);

  // Y axis label
  ctx.fillStyle = '#22c55e';
  ctx.fillText(`y (${Ly} cm)`, yAxisEnd.x + 8, yAxisEnd.y + 4);

  // T axis label with temperature range
  ctx.fillStyle = '#3b82f6';
  ctx.fillText('T (°C)', zAxisEnd.x + 8, zAxisEnd.y);

  // Add tick marks and values on T axis
  ctx.font = `${smallFontSize}px JetBrains Mono`;
  ctx.fillStyle = '#94a3b8';

  // T axis ticks (min, mid, max)
  const tTicks = [0, 0.5, 1];
  tTicks.forEach(t => {
    const zPos = t * zScale;
    const tickPoint = project(-Lx/2, -Ly/2, zPos);
    const tempValue = Tmin + t * (Tmax - Tmin);

    // Tick mark
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tickPoint.x - 5, tickPoint.y);
    ctx.lineTo(tickPoint.x, tickPoint.y);
    ctx.stroke();

    // Value
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText(tempValue.toFixed(1), tickPoint.x - 8, tickPoint.y + 4);
  });

  // Reset text alignment
  ctx.textAlign = 'left';

  // Add tick values on X axis
  const xTicks = [0, 0.5, 1];
  xTicks.forEach(t => {
    const xPos = -Lx/2 + t * Lx;
    const tickPoint = project(xPos, -Ly/2, 0);
    const xValue = t * Lx;

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tickPoint.x, tickPoint.y);
    ctx.lineTo(tickPoint.x, tickPoint.y + 5);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText(xValue.toFixed(1), tickPoint.x, tickPoint.y + 15);
  });

  // Add tick values on Y axis
  const yTicks = [0, 0.5, 1];
  yTicks.forEach(t => {
    const yPos = -Ly/2 + t * Ly;
    const tickPoint = project(-Lx/2, yPos, 0);
    const yValue = t * Ly;

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tickPoint.x, tickPoint.y);
    ctx.lineTo(tickPoint.x - 5, tickPoint.y);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText(yValue.toFixed(1), tickPoint.x - 8, tickPoint.y + 4);
  });

  ctx.textAlign = 'left';
}

// 3D Mesh Visualization Component
function Mesh3DView({ solution, Lx, Ly, gridSize }) {
  const canvasRef = useRef(null);
  const fullscreenCanvasRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 30, z: 45 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Render inline canvas
  useEffect(() => {
    render3DCanvas(canvasRef.current, solution, Lx, Ly, gridSize, rotation, false);
  }, [solution, Lx, Ly, gridSize, rotation]);

  // Render fullscreen canvas
  useEffect(() => {
    if (isFullscreen) {
      render3DCanvas(fullscreenCanvasRef.current, solution, Lx, Ly, gridSize, rotation, true);
    }
  }, [solution, Lx, Ly, gridSize, rotation, isFullscreen]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    setRotation(prev => ({
      x: Math.max(-90, Math.min(90, prev.x + dy * 0.5)),
      z: prev.z + dx * 0.5
    }));
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Close on Escape key and lock body scroll
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  return (
    <div className="relative">
      {/* Inline canvas */}
      <canvas
        ref={canvasRef}
        width={360}
        height={280}
        className="rounded-lg cursor-grab active:cursor-grabbing w-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="absolute bottom-2 left-2 text-xs text-slate-500 font-mono">
        Drag to rotate
      </div>
      <button
        onClick={() => setIsFullscreen(true)}
        className="absolute bottom-2 right-2 p-1.5 bg-slate-800/80 hover:bg-slate-700 rounded transition-colors"
        title="Fullscreen view"
      >
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>

      {/* Fullscreen Modal - rendered via Portal to escape parent CSS */}
      {isFullscreen && createPortal(
        <div
          className="fixed inset-0 z-50 flex"
          style={{ backgroundColor: '#1a1a1a' }}
        >
          {/* Main plot area - light card */}
          <div className="flex-1 p-6 flex flex-col">
            <div className="flex-1 bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
              {/* Plot header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">
                  3D Temperature Surface - Heat Equation Solution
                </h2>
              </div>

              {/* Canvas container */}
              <div className="flex-1 p-4 bg-gray-50">
                <canvas
                  ref={fullscreenCanvasRef}
                  width={1400}
                  height={800}
                  className="w-full h-full rounded-lg cursor-grab active:cursor-grabbing shadow-inner"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              </div>

              {/* Plot footer */}
              <div className="px-6 py-3 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500">
                <span>Drag to rotate the 3D surface</span>
                <span className="font-mono">SOR Finite Difference Solution</span>
              </div>
            </div>
          </div>

          {/* Right sidebar - dark */}
          <div className="w-72 bg-slate-900 border-l border-slate-700 flex flex-col">
            {/* Close button */}
            <div className="p-4 flex justify-end">
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors group border border-slate-600"
                title="Close (Esc)"
              >
                <svg className="w-5 h-5 text-slate-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sidebar content */}
            <div className="px-5 pb-6 flex-1 overflow-y-auto">
              <h3 className="text-white font-semibold text-lg mb-6 border-b border-slate-700 pb-3">
                View Options
              </h3>

              {/* Rotation controls */}
              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-sm font-medium block mb-2">
                    Rotation: {rotation.z.toFixed(0)}°
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={rotation.z}
                    onChange={(e) => setRotation(prev => ({ ...prev, z: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-xs text-slate-600 mt-1">
                    <span>0°</span>
                    <span>180°</span>
                    <span>360°</span>
                  </div>
                </div>

                {/* Reset button */}
                <button
                  onClick={() => setRotation({ x: 30, z: 45 })}
                  className="w-full mt-4 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-600 text-sm"
                >
                  Reset View
                </button>
              </div>

              {/* Info section */}
              <div className="mt-8">
                <h4 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">
                  Visualization Info
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Grid</span>
                    <span className="text-slate-300 font-mono">{gridSize} × {gridSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Domain</span>
                    <span className="text-slate-300 font-mono">{Lx} × {Ly} cm</span>
                  </div>
                </div>
              </div>

              {/* Color legend */}
              <div className="mt-8">
                <h4 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">
                  Temperature Scale
                </h4>
                <div className="h-4 rounded-full overflow-hidden" style={{
                  background: 'linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)'
                }} />
                <div className="flex justify-between mt-1 text-xs text-slate-500 font-mono">
                  <span>Cold</span>
                  <span>Hot</span>
                </div>
              </div>
            </div>

            {/* Footer hint */}
            <div className="p-4 border-t border-slate-700 text-center">
              <span className="text-slate-500 text-xs">Press ESC to close</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Contour/Heatmap View
function ContourView({ solution, Lx, Ly, gridSize, P_left, P_right,
                      y_start_left, y_end_left, y_start_right, y_end_right }) {
  if (!solution) return null;

  const { T2D, Tmin, Tmax } = solution;
  const width = 320;
  const height = (Ly / Lx) * width;
  const cellW = width / gridSize;
  const cellH = height / gridSize;
  const padding = 40;

  return (
    <svg width={width + 80} height={height + 70} className="bg-slate-900 rounded-lg">
      <text x={(width + padding) / 2 + 10} y={22} fill="#e2e8f0"
            fontSize="14" fontWeight="bold" textAnchor="middle">
        Temperature Contours
      </text>

      <g transform={`translate(${padding}, 35)`}>
        {T2D.map((row, i) =>
          row.map((temp, j) => (
            <rect
              key={`${i}-${j}`}
              x={j * cellW}
              y={(gridSize - 1 - i) * cellH}
              width={cellW + 0.5}
              height={cellH + 0.5}
              fill={getColorStr(temp, Tmin, Tmax)}
            />
          ))
        )}

        {/* Power indicators */}
        {P_left > 0 && y_end_left > y_start_left && (
          <line
            x1={0}
            y1={(1 - y_end_left / Ly) * height}
            x2={0}
            y2={(1 - y_start_left / Ly) * height}
            stroke="#fff"
            strokeWidth="4"
          />
        )}
        {P_right > 0 && y_end_right > y_start_right && (
          <line
            x1={width}
            y1={(1 - y_end_right / Ly) * height}
            x2={width}
            y2={(1 - y_start_right / Ly) * height}
            stroke="#fff"
            strokeWidth="4"
          />
        )}

        {/* Contour lines */}
        {[0.2, 0.4, 0.6, 0.8].map(level => {
          const targetT = Tmin + level * (Tmax - Tmin);
          return (
            <g key={level} opacity="0.3">
              {T2D.map((row, i) =>
                row.map((temp, j) => {
                  if (Math.abs(temp - targetT) < (Tmax - Tmin) * 0.05) {
                    return (
                      <circle
                        key={`c-${i}-${j}`}
                        cx={j * cellW + cellW / 2}
                        cy={(gridSize - 1 - i) * cellH + cellH / 2}
                        r="1"
                        fill="#fff"
                      />
                    );
                  }
                  return null;
                })
              )}
            </g>
          );
        })}
      </g>

      {/* Colorbar */}
      <defs>
        <linearGradient id="cbar" x1="0%" y1="100%" x2="0%" y2="0%">
          {[0, 0.25, 0.5, 0.75, 1].map(t => (
            <stop key={t} offset={`${t * 100}%`}
                  stopColor={getColorStr(Tmin + t * (Tmax - Tmin), Tmin, Tmax)} />
          ))}
        </linearGradient>
      </defs>
      <rect x={width + padding + 10} y={35} width={15} height={height} fill="url(#cbar)" />
      <text x={width + padding + 30} y={47} fill="#94a3b8" fontSize="10" className="font-mono">
        {Tmax.toFixed(1)}
      </text>
      <text x={width + padding + 30} y={height + 33} fill="#94a3b8" fontSize="10" className="font-mono">
        {Tmin.toFixed(1)}
      </text>
      <text x={width + padding + 25} y={height / 2 + 40} fill="#64748b" fontSize="9"
            transform={`rotate(90, ${width + padding + 25}, ${height / 2 + 40})`}>
        T (C)
      </text>

      {/* Axis labels */}
      <text x={width / 2 + padding} y={height + 60} fill="#94a3b8" fontSize="12" textAnchor="middle">
        x (cm)
      </text>
      <text x={15} y={height / 2 + 35} fill="#94a3b8" fontSize="12" textAnchor="middle"
            transform={`rotate(-90, 15, ${height / 2 + 35})`}>
        y (cm)
      </text>

      {/* Tick marks */}
      {[0, Lx/2, Lx].map((v, i) => (
        <g key={`x-${i}`}>
          <line x1={padding + i * width / 2} y1={height + 37}
                x2={padding + i * width / 2} y2={height + 42} stroke="#64748b" />
          <text x={padding + i * width / 2} y={height + 52}
                fill="#64748b" fontSize="9" textAnchor="middle">{v}</text>
        </g>
      ))}
      {[0, Ly/2, Ly].map((v, i) => (
        <g key={`y-${i}`}>
          <line x1={padding - 5} y1={35 + (1 - i / 2) * height}
                x2={padding} y2={35 + (1 - i / 2) * height} stroke="#64748b" />
          <text x={padding - 8} y={35 + (1 - i / 2) * height + 3}
                fill="#64748b" fontSize="9" textAnchor="end">{v}</text>
        </g>
      ))}
    </svg>
  );
}

// Schematic Diagram
function SchematicView({ Lx, Ly, P_left, P_right,
                        y_start_left, y_end_left, y_start_right, y_end_right }) {
  // Fixed dimensions for consistent sizing
  const fixedWidth = 160;  // Fixed width for the heatsink rectangle
  const fixedHeight = 200; // Fixed height for the heatsink rectangle
  const padding = 55;      // Padding for labels and arrows
  const width = fixedWidth + padding * 2;
  const height = fixedHeight + padding * 2;

  // Scale y-coordinates relative to the fixed height
  const scaleY = (y) => padding + (1 - y / Ly) * fixedHeight;
  const L_left = Math.max(0, y_end_left - y_start_left);
  const L_right = Math.max(0, y_end_right - y_start_right);

  return (
    <svg width={width + 30} height={height + 20} className="bg-slate-900 rounded-lg">
      <text x={width / 2 + 15} y={22} fill="#e2e8f0" fontSize="14" fontWeight="bold" textAnchor="middle">
        Heatsink Schematic
      </text>

      {/* 3D effect - depth lines */}
      <polygon
        points={`${padding + fixedWidth},${padding}
                 ${padding + fixedWidth + 15},${padding - 8}
                 ${padding + fixedWidth + 15},${padding + fixedHeight - 8}
                 ${padding + fixedWidth},${padding + fixedHeight}`}
        fill="#1e293b" stroke="#475569" strokeWidth="1"
      />
      <polygon
        points={`${padding},${padding}
                 ${padding + 15},${padding - 8}
                 ${padding + fixedWidth + 15},${padding - 8}
                 ${padding + fixedWidth},${padding}`}
        fill="#1e293b" stroke="#475569" strokeWidth="1"
      />

      {/* Main rectangle */}
      <rect
        x={padding}
        y={padding}
        width={fixedWidth}
        height={fixedHeight}
        fill="rgba(71, 85, 105, 0.3)"
        stroke="#64748b"
        strokeWidth="2"
      />

      {/* Grid indicator */}
      <rect
        x={padding + fixedWidth / 2 - 12}
        y={padding + fixedHeight / 2 - 12}
        width={24}
        height={24}
        fill="none"
        stroke="#06b6d4"
        strokeWidth="1"
        strokeDasharray="4,2"
      />
      <text x={padding + fixedWidth / 2} y={padding + fixedHeight / 2 + 4}
            fill="#06b6d4" fontSize="9" textAnchor="middle" className="font-mono">
        x,y
      </text>

      {/* Left power region */}
      {P_left > 0 && L_left > 0 && (
        <g>
          <line
            x1={padding}
            y1={scaleY(y_end_left)}
            x2={padding}
            y2={scaleY(y_start_left)}
            stroke="#ef4444"
            strokeWidth="6"
          />
          <polygon
            points={`${padding - 20},${(scaleY(y_end_left) + scaleY(y_start_left)) / 2}
                     ${padding - 8},${(scaleY(y_end_left) + scaleY(y_start_left)) / 2 - 5}
                     ${padding - 8},${(scaleY(y_end_left) + scaleY(y_start_left)) / 2 + 5}`}
            fill="#ef4444"
          />
          <text x={padding - 25} y={(scaleY(y_end_left) + scaleY(y_start_left)) / 2 + 4}
                fill="#ef4444" fontSize="10" textAnchor="end" fontWeight="bold">
            {P_left}W
          </text>
          <text x={padding - 25} y={(scaleY(y_end_left) + scaleY(y_start_left)) / 2 + 14}
                fill="#ef4444" fontSize="8" textAnchor="end">
            Power
          </text>
        </g>
      )}

      {/* Right power region */}
      {P_right > 0 && L_right > 0 && (
        <g>
          <line
            x1={padding + fixedWidth}
            y1={scaleY(y_end_right)}
            x2={padding + fixedWidth}
            y2={scaleY(y_start_right)}
            stroke="#3b82f6"
            strokeWidth="6"
          />
          <polygon
            points={`${padding + fixedWidth + 20},${(scaleY(y_end_right) + scaleY(y_start_right)) / 2}
                     ${padding + fixedWidth + 8},${(scaleY(y_end_right) + scaleY(y_start_right)) / 2 - 5}
                     ${padding + fixedWidth + 8},${(scaleY(y_end_right) + scaleY(y_start_right)) / 2 + 5}`}
            fill="#3b82f6"
          />
          <text x={padding + fixedWidth + 25} y={(scaleY(y_end_right) + scaleY(y_start_right)) / 2 + 4}
                fill="#3b82f6" fontSize="10" fontWeight="bold">
            {P_right}W
          </text>
        </g>
      )}

      {/* Dimension labels */}
      <g>
        {/* Lx */}
        <line x1={padding} y1={height - 12} x2={padding + fixedWidth} y2={height - 12}
              stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrow)" markerStart="url(#arrow-rev)" />
        <text x={padding + fixedWidth / 2} y={height + 4} fill="#94a3b8" fontSize="11" textAnchor="middle">
          L<tspan fontSize="7" baselineShift="sub">x</tspan> = {Lx} cm
        </text>

        {/* Ly */}
        <line x1={width + 5} y1={padding} x2={width + 5} y2={padding + fixedHeight}
              stroke="#94a3b8" strokeWidth="1" />
        <text x={width + 12} y={padding + fixedHeight / 2} fill="#94a3b8" fontSize="11"
              transform={`rotate(90, ${width + 12}, ${padding + fixedHeight / 2})`} textAnchor="middle">
          L<tspan fontSize="7" baselineShift="sub">y</tspan> = {Ly} cm
        </text>
      </g>

      {/* Arrows */}
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" />
        </marker>
        <marker id="arrow-rev" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
          <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" />
        </marker>
      </defs>
    </svg>
  );
}

// Slider Component
function Slider({ label, value, onChange, min, max, step = 0.1, unit = "", color = "cyan" }) {
  const colors = {
    cyan: { text: 'text-cyan-400', slider: 'slider-cyan' },
    red: { text: 'text-red-400', slider: 'slider-red' },
    blue: { text: 'text-blue-400', slider: 'slider-blue' }
  };
  const c = colors[color];

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label className="text-slate-300 text-sm font-medium">{label}</label>
        <span className={`${c.text} font-mono text-sm font-semibold`}>
          {value.toFixed(1)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full ${c.slider}`}
      />
    </div>
  );
}

// Main App
function HeatsinkSimulator() {
  const [Lx, setLx] = useState(2);
  const [Ly, setLy] = useState(4);
  const [P_left, setP_left] = useState(2.5);
  const [P_right, setP_right] = useState(2.5);
  const [y_start_left, setY_start_left] = useState(1);
  const [y_end_left, setY_end_left] = useState(3);
  const [y_start_right, setY_start_right] = useState(0);
  const [y_end_right, setY_end_right] = useState(2);

  const delta = 0.1;
  const K = 1.68;
  const T_ambient = 20;
  const H = 0.005;
  const gridSize = 50;

  const [solution, setSolution] = useState(null);
  const [isComputing, setIsComputing] = useState(false);
  // Store the parameters used for the current solution (for visualization)
  const [solvedParams, setSolvedParams] = useState({
    Lx: 2, Ly: 4, P_left: 2.5, P_right: 2.5,
    y_start_left: 1, y_end_left: 3, y_start_right: 0, y_end_right: 2
  });

  const computeSolution = useCallback(() => {
    setIsComputing(true);
    const params = {
      Lx, Ly, P_left, P_right,
      y_start_left: Math.min(y_start_left, y_end_left),
      y_end_left: Math.max(y_start_left, y_end_left),
      y_start_right: Math.min(y_start_right, y_end_right),
      y_end_right: Math.max(y_start_right, y_end_right)
    };
    setTimeout(() => {
      const result = solveHeatEquation({
        n: gridSize,
        m: gridSize,
        ...params, delta, K, H, T_ambient
      });
      setSolution(result);
      setSolvedParams(params);
      setIsComputing(false);
    }, 50);
  }, [Lx, Ly, P_left, P_right, y_start_left, y_end_left, y_start_right, y_end_right]);

  useEffect(() => {
    computeSolution();
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2"
              style={{ background: 'linear-gradient(90deg, #06b6d4, #3b82f6, #8b5cf6)',
                       WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            2D Heat Equation Solver
          </h1>
          <p className="text-slate-400 text-lg">Interactive Heatsink Temperature Simulation</p>
          <div className="mt-3 inline-block px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
            <span className="text-cyan-400 font-mono text-sm">
              ∇²T - (H/K)T = 0
            </span>
            <span className="text-slate-500 mx-2">|</span>
            <span className="text-slate-400 text-sm">Convection + Power BCs</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Controls Panel */}
          <div className="xl:col-span-1 glass rounded-xl p-5">
            <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <span className="text-cyan-400">⚙</span> Parameters
            </h2>

            <div className="space-y-5">
              {/* Geometry */}
              <div>
                <h3 className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wider">
                  Geometry
                </h3>
                <Slider label="Length Lx" value={Lx} onChange={setLx} min={1} max={8} unit=" cm" />
                <Slider label="Length Ly" value={Ly} onChange={setLy} min={1} max={8} unit=" cm" />
              </div>

              {/* Left Power */}
              <div className="pt-2 border-t border-slate-700/50">
                <h3 className="text-xs font-medium text-red-400/80 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-sm"></span>
                  Left Power Source
                </h3>
                <Slider label="Power" value={P_left} onChange={setP_left} min={0} max={10} unit=" W" color="red" />
                <Slider label="Y Start" value={y_start_left} onChange={setY_start_left} min={0} max={Ly} unit=" cm" color="red" />
                <Slider label="Y End" value={y_end_left} onChange={setY_end_left} min={0} max={Ly} unit=" cm" color="red" />
              </div>

              {/* Right Power */}
              <div className="pt-2 border-t border-slate-700/50">
                <h3 className="text-xs font-medium text-blue-400/80 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-500 rounded-sm"></span>
                  Right Power Source
                </h3>
                <Slider label="Power" value={P_right} onChange={setP_right} min={0} max={10} unit=" W" color="blue" />
                <Slider label="Y Start" value={y_start_right} onChange={setY_start_right} min={0} max={Ly} unit=" cm" color="blue" />
                <Slider label="Y End" value={y_end_right} onChange={setY_end_right} min={0} max={Ly} unit=" cm" color="blue" />
              </div>

              {/* Solve Button */}
              <button
                onClick={computeSolution}
                disabled={isComputing}
                className={`w-full py-3 font-semibold rounded-lg transition-all duration-300
                          ${isComputing ? 'computing bg-slate-700 text-slate-300' :
                            'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25'}`}
              >
                {isComputing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Solving...
                  </span>
                ) : (
                  '⚡ Solve Heat Equation'
                )}
              </button>
            </div>
          </div>

          {/* Visualization Panel */}
          <div className="xl:col-span-3 space-y-6">
            {/* Top row: Schematic + Stats + 3D */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Schematic */}
              <div className="glass rounded-xl p-4 flex justify-center items-center">
                <SchematicView
                  Lx={Lx} Ly={Ly}
                  P_left={P_left} P_right={P_right}
                  y_start_left={y_start_left} y_end_left={y_end_left}
                  y_start_right={y_start_right} y_end_right={y_end_right}
                />
              </div>

              {/* Stats */}
              <div className="glass rounded-xl p-5">
                <h3 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
                  <span className="text-cyan-400">📊</span> Results
                </h3>
                {solution && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-slate-900/60 rounded-lg border border-red-500/20">
                      <span className="text-slate-400 text-sm">Max Temperature</span>
                      <span className="text-red-400 font-mono font-bold text-lg">
                        {solution.Tmax.toFixed(2)}°C
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-900/60 rounded-lg border border-blue-500/20">
                      <span className="text-slate-400 text-sm">Min Temperature</span>
                      <span className="text-blue-400 font-mono font-bold text-lg">
                        {solution.Tmin.toFixed(2)}°C
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-900/60 rounded-lg border border-cyan-500/20">
                      <span className="text-slate-400 text-sm">ΔT (Rise)</span>
                      <span className="text-cyan-400 font-mono font-bold text-lg">
                        {(solution.Tmax - T_ambient).toFixed(2)}°C
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-900/60 rounded-lg border border-slate-600/30">
                      <span className="text-slate-400 text-sm">Grid Size</span>
                      <span className="text-slate-300 font-mono">{gridSize} x {gridSize}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 3D Mesh */}
              <div className="glass rounded-xl p-4 flex flex-col">
                <h3 className="text-slate-200 font-semibold mb-2 flex items-center gap-2">
                  <span className="text-purple-400">🔮</span> 3D Surface
                </h3>
                {solution && (
                  <Mesh3DView
                    solution={solution}
                    Lx={solvedParams.Lx}
                    Ly={solvedParams.Ly}
                    gridSize={gridSize}
                  />
                )}
              </div>
            </div>

            {/* Contour plot */}
            <div className="glass rounded-xl p-4">
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="flex-1">
                  <ContourView
                    solution={solution}
                    Lx={solvedParams.Lx} Ly={solvedParams.Ly}
                    gridSize={gridSize}
                    P_left={solvedParams.P_left} P_right={solvedParams.P_right}
                    y_start_left={solvedParams.y_start_left}
                    y_end_left={solvedParams.y_end_left}
                    y_start_right={solvedParams.y_start_right}
                    y_end_right={solvedParams.y_end_right}
                  />
                </div>

                {/* Physical Model Info */}
                <div className="lg:w-72">
                  <h3 className="text-slate-200 font-semibold mb-3 flex items-center gap-2">
                    <span className="text-cyan-400">⚗</span> Physical Model
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-slate-900/60 rounded border border-slate-700/50">
                      <div className="text-slate-500 text-xs">Conductivity K</div>
                      <div className="text-cyan-400 font-mono">{K} W/(cm°C)</div>
                    </div>
                    <div className="p-2 bg-slate-900/60 rounded border border-slate-700/50">
                      <div className="text-slate-500 text-xs">Convection H</div>
                      <div className="text-cyan-400 font-mono">{H} W/(cm²°C)</div>
                    </div>
                    <div className="p-2 bg-slate-900/60 rounded border border-slate-700/50">
                      <div className="text-slate-500 text-xs">Thickness δ</div>
                      <div className="text-cyan-400 font-mono">{delta} cm</div>
                    </div>
                    <div className="p-2 bg-slate-900/60 rounded border border-slate-700/50">
                      <div className="text-slate-500 text-xs">Ambient T</div>
                      <div className="text-cyan-400 font-mono">{T_ambient}°C</div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-slate-900/60 rounded border border-slate-700/50">
                    <div className="text-slate-400 text-xs mb-2">Boundary Conditions:</div>
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        <span className="text-slate-300">Left: Heat flux (Neumann)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span className="text-slate-300">Right: Heat flux (Neumann)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
                        <span className="text-slate-300">All: Convection (Robin)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-600 text-sm">
          Numerical Methods for PDEs | SOR (Successive Over-Relaxation) | Finite Difference Method
        </div>
      </div>
    </div>
  );
}

// Render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<HeatsinkSimulator />);
