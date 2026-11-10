# Changelog

All notable changes to this site, newest first. Dates are 2026. Each release is also a git tag; the full commit list is in `git log`.

## v1.7 - 31 Oct
- Research: the IIT Delhi internship is dated Jun 2026 – Dec 2026.
- Research: the IIT Delhi TF-QKD project links its GitHub repo (tfqkd-fso-turbulence).
- Diwali: a subtle warm glow, a few rising sparks, a ring of small lights that turns with the moon as you scroll, and a short "Happy Diwali" note. It switches itself off at 07:00 IST on 9 Nov 2026 (assets/js/diwali.js, loaded from moon.js).
- Coursework: every card carries a B.Tech tag, so M.Tech or PhD work can be tagged the same way later.
- Coursework: the Speech Signal card also links to all the Signals and Systems lab practicals on GitHub.
- Home: the info strip shows CGPA on its own line and the Leading row is aligned.
- Coursework: smaller side-by-side cards, and added the Control Systems Lab (13 experiments, MATLAB and Python) with its GitHub link.
- Coursework entries cut down to a title, one short line and links (no write-ups).
- Coursework: added the Digital Signal Processing Lab (14 MATLAB and Python experiments) with a link to its GitHub repo.
- Blog feed: added the BVP Optica repost about the CQT IIIT-Delhi visit (Qiskit Fall Fest 2026).
- Coursework: Speech Signal project is marked as submitted to Prof. Parshuram Patel; the section intro tells QKD visitors it is not meant for them.
- DCN final project: link to the simulation results (CSV, console output and nine FlowMonitor XML files). The NS-3 source file `mini-project11.cc` is not in the site yet.
- Projects, Coursework: the DCN lab is now one entry, its final project, with a link to all the lab practicals on GitHub. Added the DCN final lab project (DropTail vs RED vs CoDel in NS-3) with its report PDF. The roll number on the cover page is blacked out in the hosted copy.
- Projects page: new "Coursework" section with the Data Communication and Networking lab (NS-3), the Speech Signal Analysis FFT project and the Analog Electronics common-emitter amplifier project.
- Home page: a quiet "Open to research internships, January to April 2027" line under the facts strip.

## v1.6 - 19 Oct
- Contact page: "Open to" line for research internships, Jan to Apr 2027. Remove or update it once the dates pass.
- Blog "From LinkedIn": added the portfolio-launch post and the Photonics Spectrum 2026 post.

## v1.5 - 18 Oct
- Blog page: a 3D street scene where every post lives in its own building. Picking a post (or a building) flies the camera to that building and opens the post on its wall. Needs WebGL; without it the normal post list is shown.
- The street model is in `assets/city/`; the scene code is built from `scripts/city/` into `assets/js/city.bundle.js`.
- The city is now the whole Blog page background (replacing the moon there); posts open on the building's wall over the page. The switch above the list is a "City background / Moon" theme toggle.
- Blog intro: the first visit in a session zooms into a moon crater ("Want to know my thoughts? Let's enter the city") before the city appears. A switch above the scene turns the 3D city off and back to the plain post list; the choice is remembered.
- Moon credit (RenderX, CC BY 4.0) credited on the Privacy policy page, the README and the brand guide (not on the front pages).
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
