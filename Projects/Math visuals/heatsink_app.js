// Heatsink Thermal Analysis - React Application
// Features: Dark mode, Fullscreen 3D view, Jet colormap, Fixed-size plots

const { useState, useEffect, useCallback, useRef } = React;
const { createPortal } = ReactDOM;

// ========== Jet Colormap ==========
// Blue → Cyan → Green → Yellow → Red
function getColor(value, min, max) {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min + 0.001)));
  let r, g, b;

  if (t < 0.25) {
    r = 0; g = 4 * t; b = 1;              // Blue → Cyan
  } else if (t < 0.5) {
    r = 0; g = 1; b = 1 - 4 * (t - 0.25); // Cyan → Green
  } else if (t < 0.75) {
    r = 4 * (t - 0.5); g = 1; b = 0;      // Green → Yellow
  } else {
    r = 1; g = 1 - 4 * (t - 0.75); b = 0; // Yellow → Red
  }

  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function getColorStr(value, min, max) {
  const c = getColor(value, min, max);
  return `rgb(${c.r}, ${c.g}, ${c.b})`;
}

// ========== Icons ==========
function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

// ========== Parameter Slider ==========
function ParamSlider({ label, value, onChange, min, max, step = 0.1, unit = "" }) {
  const formatValue = (v) => {
    if (step >= 1) return v.toFixed(0);
    if (step >= 0.1) return v.toFixed(1);
    return v.toFixed(3);
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
        <span className="font-mono" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>
          {formatValue(value)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

// ========== Stat Box ==========
function StatBox({ label, value, unit, accent = false }) {
  return (
    <div className={`stat-box ${accent ? 'accent' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className={`stat-value font-mono ${accent ? 'accent' : ''}`}>
        {value}<span className="stat-unit">{unit}</span>
      </div>
    </div>
  );
}

// ========== 3D Canvas Renderer ==========
function render3DCanvas(canvas, solution, Lx, Ly, gridSize, rotation, isDarkMode, isFullscreen = false) {
  if (!solution || !canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const { T2D, Tmin, Tmax } = solution;

  // Clear canvas
  ctx.fillStyle = isDarkMode ? '#0f172a' : '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const step = Math.max(1, Math.floor(gridSize / (isFullscreen ? 60 : 25)));
  const baseScale = isFullscreen ? 50 : 35;
  const scale = baseScale * Math.min(width / 400, height / 350);
  const zScale = 2.5;
  const centerX = width / 2;
  const centerY = height / 2 + (isFullscreen ? 30 : 20);

  const azimuth = (rotation.z * Math.PI) / 180;
  const elevation = (30 * Math.PI) / 180;

  const project = (x, y, z) => {
    const x1 = x * Math.cos(azimuth) - y * Math.sin(azimuth);
    const y1 = x * Math.sin(azimuth) + y * Math.cos(azimuth);
    const screenX = x1;
    const screenY = z + y1 * Math.sin(elevation);
    const depth = y1 * Math.cos(elevation);
    return {
      x: centerX + screenX * scale,
      y: centerY - screenY * scale * 0.9,
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

      faces.push({
        points: [p00, p10, p11, p01],
        z: (p00.z + p10.z + p01.z + p11.z) / 4,
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

  // Draw axes
  const axisColor = isDarkMode ? '#94a3b8' : '#64748b';
  const axisOrigin = project(-Lx/2, -Ly/2, 0);
  const xAxisEnd = project(Lx/2 + 0.3, -Ly/2, 0);
  const yAxisEnd = project(-Lx/2, Ly/2 + 0.3, 0);
  const zAxisEnd = project(-Lx/2, -Ly/2, zScale + 0.5);

  const axisLineWidth = isFullscreen ? 2.5 : 1.5;
  const fontSize = isFullscreen ? 14 : 11;

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

  // Z axis (blue - Temperature)
  ctx.strokeStyle = '#3b82f6';
  ctx.beginPath();
  ctx.moveTo(axisOrigin.x, axisOrigin.y);
  ctx.lineTo(zAxisEnd.x, zAxisEnd.y);
  ctx.stroke();

  // Axis labels
  ctx.font = `bold ${fontSize}px Inter`;
  ctx.fillStyle = '#ef4444';
  ctx.fillText(`x (${Lx} cm)`, xAxisEnd.x + 8, xAxisEnd.y + 4);
  ctx.fillStyle = '#22c55e';
  ctx.fillText(`y (${Ly} cm)`, yAxisEnd.x + 8, yAxisEnd.y + 4);
  ctx.fillStyle = '#3b82f6';
  ctx.fillText('T (°C)', zAxisEnd.x + 8, zAxisEnd.y);

  // Temperature ticks
  ctx.font = `${fontSize - 2}px JetBrains Mono`;
  ctx.fillStyle = axisColor;
  ctx.textAlign = 'right';

  [0, 0.5, 1].forEach(t => {
    const zPos = t * zScale;
    const tickPoint = project(-Lx/2, -Ly/2, zPos);
    const tempValue = Tmin + t * (Tmax - Tmin);
    ctx.fillText(tempValue.toFixed(1), tickPoint.x - 8, tickPoint.y + 4);
  });

  ctx.textAlign = 'left';
}

// ========== 3D Surface Component ==========
function Surface3D({ solution, Lx, Ly, gridSize, isDarkMode }) {
  const canvasRef = useRef(null);
  const fullscreenCanvasRef = useRef(null);
  const [rotation, setRotation] = useState({ z: 45 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Render inline canvas
  useEffect(() => {
    render3DCanvas(canvasRef.current, solution, Lx, Ly, gridSize, rotation, isDarkMode, false);
  }, [solution, Lx, Ly, gridSize, rotation, isDarkMode]);

  // Render fullscreen canvas
  useEffect(() => {
    if (isFullscreen) {
      render3DCanvas(fullscreenCanvasRef.current, solution, Lx, Ly, gridSize, rotation, isDarkMode, true);
    }
  }, [solution, Lx, Ly, gridSize, rotation, isDarkMode, isFullscreen]);

  // Fullscreen handlers
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e) => {
        if (e.key === 'Escape') setIsFullscreen(false);
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isFullscreen]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouse.x;
    setRotation(prev => ({ z: prev.z + dx * 0.5 }));
    setLastMouse({ x: e.clientX });
  };

  const handleMouseUp = () => setIsDragging(false);

  if (!solution) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)' }}>
        Run simulation to view 3D surface
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={320}
        height={220}
        style={{ width: '100%', cursor: 'grab', borderRadius: '4px', background: 'var(--canvas-bg)' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div style={{ position: 'absolute', bottom: '8px', left: '8px', fontSize: '10px', color: 'var(--text-muted)' }}>
        Drag to rotate
      </div>
      <button
        onClick={() => setIsFullscreen(true)}
        className="btn-icon"
        style={{ position: 'absolute', bottom: '8px', right: '8px' }}
        title="Fullscreen view"
      >
        <ExpandIcon />
      </button>

      {/* Fullscreen Modal */}
      {isFullscreen && createPortal(
        <div className="fullscreen-overlay">
          <div className="fullscreen-main">
            <div className="fullscreen-canvas-wrapper">
              <div className="fullscreen-header">
                <h2>3D Temperature Surface - Heat Equation Solution</h2>
              </div>
              <div className="fullscreen-canvas-container">
                <canvas
                  ref={fullscreenCanvasRef}
                  width={1200}
                  height={700}
                  style={{ maxWidth: '100%', maxHeight: '100%', cursor: 'grab', borderRadius: '8px' }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              </div>
              <div className="fullscreen-footer">
                <span>Drag to rotate the 3D surface</span>
                <span className="font-mono">SOR Finite Difference Solution</span>
              </div>
            </div>
          </div>

          <div className="fullscreen-sidebar">
            <div className="sidebar-header">
              <button onClick={() => setIsFullscreen(false)} className="btn-icon" title="Close (Esc)">
                <CloseIcon />
              </button>
            </div>
            <div className="sidebar-content">
              <div className="sidebar-section">
                <h3>View Controls</h3>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Rotation</span>
                    <span className="font-mono" style={{ fontSize: '13px', color: 'var(--accent)' }}>{rotation.z.toFixed(0)}°</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={rotation.z}
                    onChange={(e) => setRotation({ z: parseFloat(e.target.value) })}
                  />
                </div>
                <button
                  onClick={() => setRotation({ z: 45 })}
                  className="btn-primary"
                  style={{ width: '100%', padding: '10px' }}
                >
                  Reset View
                </button>
              </div>

              <div className="sidebar-section">
                <h3>Visualization Info</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Grid</span>
                    <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{gridSize} x {gridSize}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Domain</span>
                    <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{Lx} x {Ly} cm</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>T Range</span>
                    <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{solution.Tmin.toFixed(1)} - {solution.Tmax.toFixed(1)}°C</span>
                  </div>
                </div>
              </div>

              <div className="sidebar-section">
                <h3>Temperature Scale</h3>
                <div className="color-legend"></div>
                <div className="color-legend-labels font-mono">
                  <span>Cold</span>
                  <span>Hot</span>
                </div>
              </div>
            </div>
            <div className="sidebar-footer">
              Press ESC to close
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ========== 2D Contour Plot (Fixed Size) ==========
function ContourPlot({ solution, Lx, Ly, gridSize, P_left, P_right, y_start_left, y_end_left, y_start_right, y_end_right, isDarkMode }) {
  if (!solution) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '280px', color: 'var(--text-muted)' }}>
        Run simulation to view temperature distribution
      </div>
    );
  }

  const { T2D, Tmin, Tmax } = solution;

  // FIXED container dimensions
  const containerWidth = 260;
  const containerHeight = 260;
  const padding = 40;

  // Scale content to fit
  const plotWidth = containerWidth - 20;
  const plotHeight = containerHeight - 20;
  const cellW = plotWidth / gridSize;
  const cellH = plotHeight / gridSize;

  const borderColor = isDarkMode ? 'rgba(71, 85, 105, 0.5)' : '#cbd5e1';
  const textColor = isDarkMode ? '#94a3b8' : '#64748b';
  const mutedColor = isDarkMode ? '#64748b' : '#94a3b8';

  return (
    <svg width={containerWidth + 65} height={containerHeight + 50} style={{ display: 'block', margin: '0 auto' }}>
      <g transform={`translate(${padding}, 10)`}>
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
            x1={0} y1={(1 - y_end_left / Ly) * plotHeight}
            x2={0} y2={(1 - y_start_left / Ly) * plotHeight}
            stroke="#ef4444" strokeWidth="3"
          />
        )}
        {P_right > 0 && y_end_right > y_start_right && (
          <line
            x1={plotWidth} y1={(1 - y_end_right / Ly) * plotHeight}
            x2={plotWidth} y2={(1 - y_start_right / Ly) * plotHeight}
            stroke="#3b82f6" strokeWidth="3"
          />
        )}

        {/* Border */}
        <rect x={0} y={0} width={plotWidth} height={plotHeight}
              fill="none" stroke={borderColor} strokeWidth="1" />
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
      <rect x={plotWidth + padding + 8} y={10} width={12} height={plotHeight}
            fill="url(#cbar)" stroke={borderColor} strokeWidth="1" />
      <text x={plotWidth + padding + 25} y={20} fill={textColor} fontSize="9" className="font-mono">
        {Tmax.toFixed(1)}°C
      </text>
      <text x={plotWidth + padding + 25} y={plotHeight + 8} fill={textColor} fontSize="9" className="font-mono">
        {Tmin.toFixed(1)}°C
      </text>

      {/* Axis labels */}
      <text x={plotWidth / 2 + padding} y={containerHeight + 35} fill={textColor} fontSize="11" textAnchor="middle">
        x (cm)
      </text>
      <text x={12} y={containerHeight / 2 + 10} fill={textColor} fontSize="11" textAnchor="middle"
            transform={`rotate(-90, 12, ${containerHeight / 2 + 10})`}>
        y (cm)
      </text>

      {/* Ticks */}
      {[0, Lx/2, Lx].map((v, i) => (
        <g key={`x-${i}`}>
          <line x1={padding + i * plotWidth / 2} y1={containerHeight - 8}
                x2={padding + i * plotWidth / 2} y2={containerHeight - 3} stroke={mutedColor} />
          <text x={padding + i * plotWidth / 2} y={containerHeight + 10}
                fill={mutedColor} fontSize="9" textAnchor="middle" className="font-mono">{v.toFixed(1)}</text>
        </g>
      ))}
      {[0, Ly/2, Ly].map((v, i) => (
        <g key={`y-${i}`}>
          <line x1={padding - 5} y1={10 + (1 - i / 2) * plotHeight}
                x2={padding} y2={10 + (1 - i / 2) * plotHeight} stroke={mutedColor} />
          <text x={padding - 8} y={10 + (1 - i / 2) * plotHeight + 3}
                fill={mutedColor} fontSize="9" textAnchor="end" className="font-mono">{v.toFixed(1)}</text>
        </g>
      ))}
    </svg>
  );
}

// ========== Schematic Diagram ==========
function Schematic({ Lx, Ly, P_left, P_right, y_start_left, y_end_left, y_start_right, y_end_right, delta, isDarkMode }) {
  const baseDim = 140;
  const padding = 45;
  const minScale = 0.75, maxScale = 1.25;
  const minSlider = 1, maxSlider = 8;

  const mapScale = (val) => minScale + ((val - minSlider) / (maxSlider - minSlider)) * (maxScale - minScale);

  const rectW = baseDim * mapScale(Lx);
  const rectH = baseDim * mapScale(Ly);
  const width = rectW + padding * 2;
  const height = rectH + padding * 2;
  const depth = 10;

  const scaleY = (y) => padding + (1 - y / Ly) * rectH;

  const fillColor = isDarkMode ? 'rgba(30, 41, 59, 0.6)' : '#f8fafc';
  const strokeColor = isDarkMode ? 'rgba(71, 85, 105, 0.5)' : '#94a3b8';
  const depthFill = isDarkMode ? 'rgba(51, 65, 85, 0.5)' : '#e2e8f0';
  const depthFill2 = isDarkMode ? 'rgba(71, 85, 105, 0.5)' : '#f1f5f9';
  const textColor = isDarkMode ? '#94a3b8' : '#64748b';

  return (
    <svg width={width + 25} height={height + 15} style={{ display: 'block', margin: '0 auto' }}>
      {/* 3D effect */}
      <polygon
        points={`${padding + rectW},${padding}
                 ${padding + rectW + depth},${padding - depth * 0.5}
                 ${padding + rectW + depth},${padding + rectH - depth * 0.5}
                 ${padding + rectW},${padding + rectH}`}
        fill={depthFill} stroke={strokeColor} strokeWidth="1"
      />
      <polygon
        points={`${padding},${padding}
                 ${padding + depth},${padding - depth * 0.5}
                 ${padding + rectW + depth},${padding - depth * 0.5}
                 ${padding + rectW},${padding}`}
        fill={depthFill2} stroke={strokeColor} strokeWidth="1"
      />

      {/* Main body */}
      <rect x={padding} y={padding} width={rectW} height={rectH}
            fill={fillColor} stroke={strokeColor} strokeWidth="2" rx="2" />

      {/* Thickness label */}
      <text x={padding + rectW / 2} y={padding + rectH / 2 + 4}
            fill={textColor} fontSize="10" textAnchor="middle" className="font-mono">
        δ = {delta} cm
      </text>

      {/* Left power */}
      {P_left > 0 && y_end_left > y_start_left && (
        <g>
          <line x1={padding} y1={scaleY(y_end_left)} x2={padding} y2={scaleY(y_start_left)}
                stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
          <polygon points={`${padding - 18},${(scaleY(y_end_left) + scaleY(y_start_left)) / 2}
                           ${padding - 6},${(scaleY(y_end_left) + scaleY(y_start_left)) / 2 - 5}
                           ${padding - 6},${(scaleY(y_end_left) + scaleY(y_start_left)) / 2 + 5}`}
                   fill="#ef4444" />
          <text x={padding - 22} y={(scaleY(y_end_left) + scaleY(y_start_left)) / 2 + 4}
                fill="#ef4444" fontSize="10" textAnchor="end" fontWeight="600" className="font-mono">
            {P_left.toFixed(1)}W
          </text>
        </g>
      )}

      {/* Right power */}
      {P_right > 0 && y_end_right > y_start_right && (
        <g>
          <line x1={padding + rectW} y1={scaleY(y_end_right)}
                x2={padding + rectW} y2={scaleY(y_start_right)}
                stroke="#3b82f6" strokeWidth="5" strokeLinecap="round" />
          <polygon points={`${padding + rectW + 18},${(scaleY(y_end_right) + scaleY(y_start_right)) / 2}
                           ${padding + rectW + 6},${(scaleY(y_end_right) + scaleY(y_start_right)) / 2 - 5}
                           ${padding + rectW + 6},${(scaleY(y_end_right) + scaleY(y_start_right)) / 2 + 5}`}
                   fill="#3b82f6" />
          <text x={padding + rectW + 22} y={(scaleY(y_end_right) + scaleY(y_start_right)) / 2 + 4}
                fill="#3b82f6" fontSize="10" fontWeight="600" className="font-mono">
            {P_right.toFixed(1)}W
          </text>
        </g>
      )}

      {/* Dimensions */}
      <line x1={padding} y1={height - 8} x2={padding + rectW} y2={height - 8}
            stroke={textColor} strokeWidth="1" />
      <text x={padding + rectW / 2} y={height + 8} fill={textColor} fontSize="10"
            textAnchor="middle" className="font-mono">
        Lx = {Lx.toFixed(1)} cm
      </text>

      <line x1={width + 3} y1={padding} x2={width + 3} y2={padding + rectH}
            stroke={textColor} strokeWidth="1" />
      <text x={width + 10} y={padding + rectH / 2} fill={textColor} fontSize="10"
            className="font-mono" transform={`rotate(90, ${width + 10}, ${padding + rectH / 2})`} textAnchor="middle">
        Ly = {Ly.toFixed(1)} cm
      </text>
    </svg>
  );
}

// ========== Main Application ==========
function HeatsinkAnalyzer() {
  // Theme state (dark mode default)
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Set dark mode on initial mount
  useEffect(() => {
    document.body.classList.add('dark');
  }, []);

  // Geometry
  const [Lx, setLx] = useState(2.0);
  const [Ly, setLy] = useState(4.0);

  // Thermal properties
  const [K, setK] = useState(1.68);
  const [H, setH] = useState(0.005);
  const [T_ambient, setT_ambient] = useState(20);
  const [delta, setDelta] = useState(0.1);

  // Left power source
  const [P_left, setP_left] = useState(2.5);
  const [y_start_left, setY_start_left] = useState(1.0);
  const [y_end_left, setY_end_left] = useState(3.0);

  // Right power source
  const [P_right, setP_right] = useState(2.5);
  const [y_start_right, setY_start_right] = useState(0.0);
  const [y_end_right, setY_end_right] = useState(2.0);

  const gridSize = 50;
  const [solution, setSolution] = useState(null);
  const [isComputing, setIsComputing] = useState(false);
  const [solvedParams, setSolvedParams] = useState(null);

  // Toggle dark mode
  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      document.body.classList.toggle('dark', newMode);
      return newMode;
    });
  }, []);

  const computeSolution = useCallback(() => {
    setIsComputing(true);
    const params = {
      Lx, Ly, P_left, P_right,
      y_start_left: Math.min(y_start_left, y_end_left),
      y_end_left: Math.max(y_start_left, y_end_left),
      y_start_right: Math.min(y_start_right, y_end_right),
      y_end_right: Math.max(y_start_right, y_end_right),
      K, H, T_ambient, delta
    };

    setTimeout(() => {
      const result = solveHeatEquation({
        n: gridSize, m: gridSize, ...params
      });
      setSolution(result);
      setSolvedParams(params);
      setIsComputing(false);
    }, 50);
  }, [Lx, Ly, P_left, P_right, y_start_left, y_end_left, y_start_right, y_end_right, K, H, T_ambient, delta]);

  useEffect(() => {
    computeSolution();
  }, []);

  return (
    <div style={{ minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Heatsink Thermal Analysis
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              2D Heat Equation Solver | Finite Difference Method (SOR)
            </p>
          </div>
          <button onClick={toggleTheme} className="btn-icon theme-toggle" title={isDarkMode ? 'Light mode' : 'Dark mode'}>
            {isDarkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>

          {/* Left Panel - Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Geometry */}
            <div className="card" style={{ padding: '16px' }}>
              <div className="section-header">Geometry</div>
              <ParamSlider label="Length X" value={Lx} onChange={setLx} min={1} max={8} step={0.1} unit=" cm" />
              <ParamSlider label="Length Y" value={Ly} onChange={setLy} min={1} max={8} step={0.1} unit=" cm" />
              <ParamSlider label="Thickness (δ)" value={delta} onChange={setDelta} min={0.05} max={1.0} step={0.05} unit=" cm" />
            </div>

            {/* Thermal Properties */}
            <div className="card" style={{ padding: '16px' }}>
              <div className="section-header">Thermal Properties</div>
              <ParamSlider label="Conductivity (k)" value={K} onChange={setK} min={0.1} max={5.0} step={0.01} unit=" W/(cm·°C)" />
              <ParamSlider label="Convection (h)" value={H} onChange={setH} min={0.001} max={0.05} step={0.001} unit=" W/(cm²·°C)" />
              <ParamSlider label="Ambient Temp" value={T_ambient} onChange={setT_ambient} min={-20} max={100} step={1} unit=" °C" />
            </div>

            {/* Left Power Source */}
            <div className="card" style={{ padding: '16px' }}>
              <div className="section-header" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                Left Power Source
              </div>
              <ParamSlider label="Power" value={P_left} onChange={setP_left} min={0} max={10} step={0.1} unit=" W" />
              <ParamSlider label="Y Start" value={y_start_left} onChange={setY_start_left} min={0} max={Ly} step={0.1} unit=" cm" />
              <ParamSlider label="Y End" value={y_end_left} onChange={setY_end_left} min={0} max={Ly} step={0.1} unit=" cm" />
            </div>

            {/* Right Power Source */}
            <div className="card" style={{ padding: '16px' }}>
              <div className="section-header" style={{ color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                Right Power Source
              </div>
              <ParamSlider label="Power" value={P_right} onChange={setP_right} min={0} max={10} step={0.1} unit=" W" />
              <ParamSlider label="Y Start" value={y_start_right} onChange={setY_start_right} min={0} max={Ly} step={0.1} unit=" cm" />
              <ParamSlider label="Y End" value={y_end_right} onChange={setY_end_right} min={0} max={Ly} step={0.1} unit=" cm" />
            </div>

            {/* Compute Button */}
            <button
              className={`btn-primary ${isComputing ? 'computing' : ''}`}
              onClick={computeSolution}
              disabled={isComputing}
              style={{ width: '100%' }}
            >
              {isComputing ? (
                <>
                  <svg className="animate-spin" style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Computing...
                </>
              ) : (
                'Compute Solution'
              )}
            </button>
          </div>

          {/* Right Panel - Visualizations */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Top Row: Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <StatBox label="Max Temp" value={solution ? solution.Tmax.toFixed(2) : '--'} unit="°C" accent />
              <StatBox label="Min Temp" value={solution ? solution.Tmin.toFixed(2) : '--'} unit="°C" />
              <StatBox label="ΔT Rise" value={solution ? (solution.Tmax - T_ambient).toFixed(2) : '--'} unit="°C" />
              <StatBox label="Total Power" value={(P_left + P_right).toFixed(1)} unit="W" />
            </div>

            {/* Middle Row: Schematic + 3D Surface */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  Heatsink Geometry
                </div>
                <Schematic
                  Lx={Lx} Ly={Ly} delta={delta}
                  P_left={P_left} P_right={P_right}
                  y_start_left={y_start_left} y_end_left={y_end_left}
                  y_start_right={y_start_right} y_end_right={y_end_right}
                  isDarkMode={isDarkMode}
                />
              </div>
              <div className="card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  3D Temperature Surface
                </div>
                <Surface3D
                  solution={solution}
                  Lx={solvedParams?.Lx || Lx}
                  Ly={solvedParams?.Ly || Ly}
                  gridSize={gridSize}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>

            {/* Bottom Row: 2D Contour + Parameters */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  Temperature Distribution
                </div>
                <ContourPlot
                  solution={solution}
                  Lx={solvedParams?.Lx || Lx}
                  Ly={solvedParams?.Ly || Ly}
                  gridSize={gridSize}
                  P_left={solvedParams?.P_left || P_left}
                  P_right={solvedParams?.P_right || P_right}
                  y_start_left={solvedParams?.y_start_left || y_start_left}
                  y_end_left={solvedParams?.y_end_left || y_end_left}
                  y_start_right={solvedParams?.y_start_right || y_start_right}
                  y_end_right={solvedParams?.y_end_right || y_end_right}
                  isDarkMode={isDarkMode}
                />
              </div>
              <div className="card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  Simulation Parameters
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div className="param-box">
                    <div className="param-label">Conductivity</div>
                    <div className="param-value font-mono">{K.toFixed(2)} W/(cm·°C)</div>
                  </div>
                  <div className="param-box">
                    <div className="param-label">Convection</div>
                    <div className="param-value font-mono">{H.toFixed(3)} W/(cm²·°C)</div>
                  </div>
                  <div className="param-box">
                    <div className="param-label">Ambient</div>
                    <div className="param-value font-mono">{T_ambient}°C</div>
                  </div>
                  <div className="param-box">
                    <div className="param-label">Thickness</div>
                    <div className="param-value font-mono">{delta.toFixed(2)} cm</div>
                  </div>
                  <div className="param-box">
                    <div className="param-label">Grid</div>
                    <div className="param-value font-mono">{gridSize} x {gridSize}</div>
                  </div>
                  <div className="param-box">
                    <div className="param-label">Domain</div>
                    <div className="param-value font-mono">{Lx.toFixed(1)} x {Ly.toFixed(1)} cm</div>
                  </div>
                </div>
                <div className="param-box" style={{ marginTop: '12px' }}>
                  <div className="param-label" style={{ marginBottom: '6px' }}>Boundary Conditions</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
                      Left: Neumann (Heat Flux)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></span>
                      Right: Neumann (Heat Flux)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-muted)' }}></span>
                      All: Robin (Convection)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
          Successive Over-Relaxation (SOR) | Finite Difference Method | Numerical Analysis
        </div>
      </div>
    </div>
  );
}

// Render application
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<HeatsinkAnalyzer />);
