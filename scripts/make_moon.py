"""Render assets/img/moon.webp: a procedural, lit near-side moon (maria, craters with rims, ray craters).
Run: python3 scripts/make_moon.py   (needs numpy, scipy, pillow)"""
import numpy as np
from scipy.ndimage import gaussian_filter, map_coordinates
from PIL import Image
from pathlib import Path

N = 640
rng = np.random.default_rng(7)
y, x = np.mgrid[-1:1:N*1j, -1:1:N*1j]
r2 = x*x + y*y
mask = r2 < 1
z = np.sqrt(np.clip(1 - r2, 0, 1))

def fbm(scale, octaves=5, seed=0):
    g = np.random.default_rng(seed); out = np.zeros((N, N)); amp = 1; tot = 0
    for o in range(octaves):
        s = max(2, int(N / (scale / 2**o)))
        n = gaussian_filter(g.standard_normal((N, N)), N / s * 0.6)
        out += amp * n / (n.std() + 1e-9); tot += amp; amp *= 0.55
    return out / tot

# albedo: bright highland with soft mottling
alb = 0.64 + 0.05 * fbm(120, 5, 1) + 0.025 * fbm(30, 4, 2)

# maria (near side, north up)
maria = [(-0.20,-0.45,.30,.22),(0.20,-0.27,.17,.15),(0.36,0.00,.22,.16),(0.62,0.16,.15,.14),
         (0.74,-0.30,.09,.07),(-0.58,-0.08,.34,.30),(-0.26,0.36,.20,.14),(-0.52,0.42,.10,.09),
         (0.05,-0.70,.20,.05),(0.10,0.05,.10,.07),(-0.05,-0.12,.12,.10),(-0.80,-0.30,.08,.20)]
warp = 0.06 * fbm(60, 4, 3)
m = np.zeros((N, N))
for cx, cy, rx, ry in maria:
    d = np.sqrt(((x - cx + warp) / rx)**2 + ((y - cy + warp.T) / ry)**2)
    m = np.maximum(m, np.clip(1.15 - d, 0, 1))
m = gaussian_filter(np.clip(m * 1.6, 0, 1), 3) * (0.8 + 0.2 * fbm(40, 3, 4))
alb *= 1 - 0.52 * np.clip(m * 1.5, 0, 1)

# craters: height field
h = np.zeros((N, N)); rays = np.zeros((N, N))
def crater(cx, cy, R, depth):
    global h
    px, py = (cx + 1) / 2 * N, (cy + 1) / 2 * N; pr = R / 2 * N
    x0, x1 = int(max(0, px - 2.4*pr)), int(min(N, px + 2.4*pr))
    y0, y1 = int(max(0, py - 2.4*pr)), int(min(N, py + 2.4*pr))
    if x1 <= x0 or y1 <= y0: return
    yy, xx = np.mgrid[y0:y1, x0:x1]
    rho = np.hypot(xx - px, yy - py) / pr
    bowl = -depth * np.clip(1 - rho**2, 0, 1)
    rim = depth * 0.45 * np.exp(-((rho - 1.0) / 0.18)**2)
    ej = depth * 0.12 * np.exp(-np.clip(rho - 1, 0, None) * 2.2) * (rho > 1)
    h[y0:y1, x0:x1] += bowl + rim + ej
sizes = 0.0030 * (1 - rng.random(5200))**(-1.0)
sizes = np.clip(sizes, 0.0030, 0.045)
for R in sizes:
    a = rng.random() * 6.283; rr = np.sqrt(rng.random()) * 0.97
    ix = int((rr*np.cos(a)+1)/2*(N-1)); iy = int((rr*np.sin(a)+1)/2*(N-1))
    if R > 0.008 and rng.random() < m[iy, ix] * 0.92: continue
    crater(rr*np.cos(a), rr*np.sin(a), R, R * rng.uniform(0.07, 0.14))
# a few large, named-style craters
for cx, cy, R in [(0.0,0.72,.045),(-0.30,-0.05,.035),(-0.62,0.12,.03),(0.28,-0.55,.025),(-0.12,0.52,.03)]:
    crater(cx, cy, R, R * 0.2)
h = gaussian_filter(h, 0.6)

# ray systems around two fresh craters (Tycho-like, Copernicus-like)
ang = np.arctan2(y, x)
for cx, cy, L in [(0.0, 0.72, 0.75), (-0.30, -0.05, 0.28)]:
    dx, dy = x - cx, y - cy; d = np.hypot(dx, dy); a = np.arctan2(dy, dx)
    k = np.abs(np.sin(a * 7 + 2 * np.sin(a * 3 + cx * 9)))**6
    rays += k * np.exp(-d / L) * (d > 0.04) * 0.35
    rays += np.exp(-d / 0.05) * 0.5
alb = np.clip(alb + 0.22 * rays * (1 - 0.6 * m), 0, 1)

# relief shading from the same light direction
L = np.array([-0.42, -0.20, 0.88]); L /= np.linalg.norm(L)
gy, gx = np.gradient(h * N * 0.9)
nx0, ny0, nz0 = x / 1.0, y / 1.0, z
nx, ny, nz = nx0 - gx * 0.55, ny0 - gy * 0.55, nz0
nl = np.sqrt(nx**2 + ny**2 + nz**2) + 1e-9
lam_sphere = np.clip(nx0*L[0] + ny0*L[1] + nz0*L[2], 0, 1)
lam_relief = np.clip((nx*L[0] + ny*L[1] + nz*L[2]) / nl, 0, 1)
# relief contrast fades toward the terminator, mixes with the sphere term
lit = (0.30 + 0.80 * lam_sphere) * (1.0 + 1.1 * (lam_relief - lam_sphere))
lit = np.clip(lit, 0, 1.2)
img = alb * lit
img *= 1 - 0.18 * (1 - z)                    # mild limb darkening
img = np.clip(img * 1.25, 0, 1) ** (1 / 1.05)

rgb = np.stack([img * 1.00, img * 0.985, img * 0.96], -1)   # faint warm grey
a = np.clip((1 - np.sqrt(r2)) * N * 0.5, 0, 1)               # antialiased edge
out = np.dstack([np.clip(rgb, 0, 1), a])
Path(__file__).resolve().parent.parent.joinpath("assets/img").mkdir(exist_ok=True)
Image.fromarray((out * 255).astype(np.uint8), "RGBA").save(
    Path(__file__).resolve().parent.parent / "assets/img/moon.webp", quality=88, method=6)
print("ok")
