// SOR (Successive Over-Relaxation) solver for 2D heat equation
// Solves steady-state heat conduction with Neumann and Robin boundary conditions

function solveHeatEquation(params) {
  const {
    n, m, Lx, Ly, P_left, P_right, delta, K, H, T_ambient,
    y_start_left, y_end_left, y_start_right, y_end_right
  } = params;

  const hx = Lx / (n - 1);
  const hy = Ly / (m - 1);
  const L_left = Math.max(0, y_end_left - y_start_left);
  const L_right = Math.max(0, y_end_right - y_start_right);

  // Initialize temperature field
  let T = new Array(n * m).fill(0);

  // Helper to convert (i,j) to linear index - column-major like MATLAB
  const idx = (i, j) => j * m + i;

  // SOR (Successive Over-Relaxation) parameters
  // Optimal omega for 2D Laplacian accelerates convergence ~100x
  const omega = 2 / (1 + Math.sin(Math.PI / Math.max(n, m)));
  const maxIter = 50000;
  const tol = 1e-6;

  for (let iter = 0; iter < maxIter; iter++) {
    let maxDiff = 0;

    for (let j = 0; j < n; j++) {
      for (let i = 0; i < m; i++) {
        const k = idx(i, j);
        const y = i * hy;
        const oldT = T[k];
        let newT;

        const isLeft = (j === 0);
        const isRight = (j === n - 1);
        const isBottom = (i === 0);
        const isTop = (i === m - 1);

        // Include half-cell tolerance to match MATLAB's inclusive boundary behavior
        const inLeftPower = isLeft && L_left > 0 && P_left > 0 &&
                           y >= y_start_left - 0.5 * hy && y <= y_end_left + 0.5 * hy;
        const inRightPower = isRight && L_right > 0 && P_right > 0 &&
                            y >= y_start_right - 0.5 * hy && y <= y_end_right + 0.5 * hy;

        if (isLeft && isBottom) {
          newT = (T[idx(1, 0)] + T[idx(0, 1)]) / 2;
        } else if (isLeft && isTop) {
          newT = (T[idx(m - 2, 0)] + T[idx(m - 1, 1)]) / 2;
        } else if (isRight && isBottom) {
          newT = (T[idx(1, n - 1)] + T[idx(0, n - 2)]) / 2;
        } else if (isRight && isTop) {
          newT = (T[idx(m - 2, n - 1)] + T[idx(m - 1, n - 2)]) / 2;
        } else if (isTop) {
          const coeff = 3 - 2 * hy * H / K;
          newT = (4 * T[idx(i - 1, j)] - T[idx(i - 2, j)]) / coeff;
        } else if (isBottom) {
          const coeff = 3 - 2 * hy * H / K;
          newT = (4 * T[idx(i + 1, j)] - T[idx(i + 2, j)]) / coeff;
        } else if (inLeftPower) {
          const q = P_left / (L_left * delta);
          newT = (4 * T[idx(i, 1)] - T[idx(i, 2)] + 2 * hx * q / K) / 3;
        } else if (isLeft) {
          const coeff = 3 - 2 * hx * H / K;
          newT = (4 * T[idx(i, 1)] - T[idx(i, 2)]) / coeff;
        } else if (inRightPower) {
          const q = P_right / (L_right * delta);
          newT = (4 * T[idx(i, n - 2)] - T[idx(i, n - 3)] + 2 * hx * q / K) / 3;
        } else if (isRight) {
          const coeff = 3 - 2 * hx * H / K;
          newT = (4 * T[idx(i, n - 2)] - T[idx(i, n - 3)]) / coeff;
        } else {
          // Interior: factor of 2 on H term matches MATLAB's 2*(1/hx² + 1/hy² + H/(K*δ))
          const coeff = 2 * (1 / (hx * hx) + 1 / (hy * hy) + H / (K * delta));
          newT = (
            (T[idx(i, j + 1)] + T[idx(i, j - 1)]) / (hx * hx) +
            (T[idx(i + 1, j)] + T[idx(i - 1, j)]) / (hy * hy)
          ) / coeff;
        }

        // Apply SOR relaxation: T_new = omega * T_gauss_seidel + (1-omega) * T_old
        const sorT = omega * newT + (1 - omega) * oldT;
        T[k] = sorT;
        maxDiff = Math.max(maxDiff, Math.abs(sorT - oldT));
      }
    }

    if (maxDiff < tol) break;
  }

  T = T.map(t => t + T_ambient);

  const T2D = [];
  for (let i = 0; i < m; i++) {
    T2D[i] = [];
    for (let j = 0; j < n; j++) {
      T2D[i][j] = T[idx(i, j)];
    }
  }

  return { T2D, Tmin: Math.min(...T), Tmax: Math.max(...T) };
}
