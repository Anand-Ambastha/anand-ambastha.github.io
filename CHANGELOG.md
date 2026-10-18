# Changelog

All notable changes to this site, newest first. Dates are 2026. Each release is also a git tag; the full commit list is in `git log`.

## v1.5 - 18 Oct
- Blog page: a 3D street scene where every post lives in its own building. Picking a post (or a building) flies the camera to that building and opens the post on its wall. Needs WebGL; without it the normal post list is shown.
- The street model is in `assets/city/`; the scene code is built from `scripts/city/` into `assets/js/city.bundle.js`.
- The city is now the whole Blog page background (replacing the moon there); posts open on the building's wall over the page. The switch above the list is a "City background / Moon" theme toggle.
- Blog intro: the first visit in a session zooms into a moon crater ("Want to know my thoughts? Let's enter the city") before the city appears. A switch above the scene turns the 3D city off and back to the plain post list; the choice is remembered.
- Moon credit (RenderX, CC BY 4.0) added to every footer and the brand guide.
- Background moon now rotates with scroll, uses a real lunar texture, and is larger.

## v1.4 - 18 Oct
- Coursework on the About page now includes Control Systems and Microelectronics.

## v1.3 - 18 Oct
- Fixed: stars, moon and satellite were hidden behind the page background; they show again.
- BVP Optica role now links to bvpoptica.com (home and About).

## v1.2 - 17 Oct
- Added a privacy policy page, linked from every footer and listed in the sitemap.
- Added keywords meta to every public page, and structured data to the CV page.
- Tried a browser-based post editor (`/admin/`) and reverted it; posts are still added as Markdown in `posts/`.

## v1.1 - 15 Oct
- Look: serif italic wordmark with an "aka" line, subtle moon and drifting satellite, photons along the hero link path, card polish.
- Brand: `theme/` folder with design tokens and a brand guide; planet-and-orbit favicon set.
- SEO: name variants and QKD keywords in the home title, description and structured data.
- Cross-browser: `-webkit-backdrop-filter`, glass fallback, no-JS blog list, browser support table in the README.
- Content: SocProS 2025 and CRC Press chapters, ANTS 2025 note, supervisors linked, report numbers used in the paddy and OptiSystem posts, QSAFire dates, a draft how-to post.
- Links: Google Scholar and ResearchGate in the footer and structured data.
- Blog: each post has its own page, RSS feed, build script (`scripts/build_posts.py`), LinkedIn series.
- Site moved to the user site https://anand-ambastha.github.io/.

## v1.0 - 14 Oct
- First release: portfolio with Research, Projects, Publications, Blog, Contact and CV pages.
- Black starfield design with glass UI, folder-per-page URLs, search and social-sharing metadata.
- Project write-ups: QSAFire, SateSim, BB84 constellation simulator, paddy stress classifier, OptiSystem prototype, early AI projects.
- Phone number kept off the site; CV PDF is redacted.
