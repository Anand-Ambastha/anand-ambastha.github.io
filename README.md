# Anand Kumar · Portfolio

Personal research portfolio of **Anand Kumar**, an undergraduate researcher working on quantum communications, free-space optical (FSO) channel modeling and satellite/NTN systems.

The site is fully static: plain HTML, CSS and a small amount of JavaScript, with **no build step and no dependencies to install**. It has a black background with a star field, frosted-glass navigation and cards, and a Markdown-powered blog.

- Live site: _add your GitHub Pages URL here after deploying_
- GitHub: [github.com/Anand-Ambastha](https://github.com/Anand-Ambastha)
- LinkedIn: [linkedin.com/in/anand-kumar05](https://www.linkedin.com/in/anand-kumar05)

---

## Contents

- [Features](#features)
- [Pages](#pages)
- [Project structure](#project-structure)
- [Run locally](#run-locally)
- [Write a blog post](#write-a-blog-post)
- [Markdown features supported in posts](#markdown-features-supported-in-posts)
- [Hidden short links](#hidden-short-links)
- [Edit the content](#edit-the-content)
- [Design system](#design-system)
- [Deploy with GitHub Pages](#deploy-with-github-pages)
- [Search engine optimisation](#search-engine-optimisation)
- [How the blog works](#how-the-blog-works)
- [Third-party libraries](#third-party-libraries)
- [Browser support](#browser-support)
- [Troubleshooting](#troubleshooting)

---

## Features

- **Eight pages** with a shared navigation bar and footer.
- **Space theme**: black background with a fixed star field (pure CSS, a slow twinkle that stops for visitors who prefer reduced motion).
- **Glass interface**: the top bar, buttons and cards use translucent backgrounds with a backdrop blur.
- **Markdown blog**: write posts as `.md` files. They are rendered with styled headings, quotes, code blocks with a Copy button, tables, images and TeX math.
- **Tag filtering** on the blog listing and a "Latest writing" section on the home page that appears once a post exists.
- **Publications page** with sections for published and accepted work, preprints, thesis and reports, and presentation slides.
- **Responsive**: works from phone width up to wide desktop screens. On phones the menu becomes a swipeable row.
- **Accessible basics**: semantic HTML, visible keyboard focus, `aria-current` on the active page, and reduced-motion support.

## Pages

| Page | File | What it shows |
| --- | --- | --- |
| Home | `index.html` | Headline, satellite-link figure, selected work, latest posts, contact prompt |
| Research | `/research/` | Three research positions with methods and validated results |
| Projects | `/projects/` | Research projects and a section of early AI hackathon builds |
| Publications | `/publications/` | Published and accepted papers, preprints, thesis and reports, slides |
| Blog | `/blog/` | Post listing with tag filters |
| Post | `/post/` | A single post, opened as `/post/#post-slug` |
| About | `/about/` | Bio, focus areas, education, honors, skills, leadership |
| Contact | `/contact/` | Email with a copy button, phone, LinkedIn, GitHub |

## Project structure

```
.
├── index.html              Home
├── research/index.html     Research positions and results
├── projects/index.html     Projects
├── publications/index.html Papers, preprints, thesis and reports, slides
├── blog/index.html         Blog listing with tag filter
├── post/index.html         Single blog post (/post/#post-slug)
├── about/index.html        Bio, education, skills, leadership
├── contact/index.html      Contact details
├── go/index.html           Hidden redirect page (not linked in the menu)
├── links.json              Short link names and their targets
├── 404.html                Page shown for unknown addresses
├── sitemap.xml             Pages for search engines
├── robots.txt              Crawler rules and sitemap location
├── assets/
│   ├── css/
│   │   └── styles.css      Shared styles; design tokens at the top
│   ├── js/
│   │   └── blog.js         Blog engine: loads and renders Markdown posts
│   └── img/
│       ├── og-image.png    1200 x 630 image used when links are shared
│       ├── favicon.svg     Browser tab icon
│       └── apple-touch-icon.png
├── posts/
│   ├── index.json          List of post files, one file name per entry
│   ├── welcome-to-the-blog.md   Sample post that shows every style
│   └── img/                Images used in posts
├── README.md
└── .gitignore
```

Each page lives in its own folder as `index.html`, so addresses have no `.html` ending: `/research/`, `/blog/`, `/about/`.

## Run locally

Browsers block `fetch()` on files opened directly with `file://`, and the blog loads posts with `fetch()`. Serve the folder with any static server.

Using Python (no install needed):

```bash
python3 -m http.server 8000
```

Using Node:

```bash
npx serve .
```

Then open <http://localhost:8000>. Pages open at `/research/`, `/blog/` and so on. The post page also loads `marked`, `DOMPurify` and `MathJax` from a CDN, so you need an internet connection to see rendered posts.

## Write a blog post

1. **Create a Markdown file** in `posts/`, for example `posts/turbulence-and-key-rate.md`, and start it with a front matter block:

   ```markdown
   ---
   title: Turbulence and the key rate
   date: 2026-10-20
   tags: [qkd, turbulence]
   summary: One or two sentences shown on the post card.
   ---

   Your post starts here, written in Markdown.
   ```

2. **Register the file** by adding its name to `posts/index.json`:

   ```json
   [
     "turbulence-and-key-rate.md",
     "welcome-to-the-blog.md"
   ]
   ```

3. **Add images** (optional) to `posts/img/` and link them relative to that folder:

   ```markdown
   ![Link budget](img/link-budget.png)
   ```

4. **Commit and push.** With GitHub Pages enabled, the post appears after the next deploy.

### Front matter fields

| Field | Required | Description |
| --- | --- | --- |
| `title` | Yes | Post title. Falls back to the file name if missing. |
| `date` | Yes | `YYYY-MM-DD`. Posts are sorted newest first. |
| `tags` | No | List in square brackets, such as `[qkd, satellite]`. Used for filter buttons. |
| `summary` | No | Text for the post card. If missing, the first lines of the post are used. |
| `draft` | No | Set to `true` to hide the post until it is ready. |
| `category` | No | Set to `project` to list the post under **Project blogs**. Leave it out and the post appears under **My thoughts**, the first group on the Blog page. |

### Build step for posts

Each post also gets its own real page at `/blog/<slug>/`, so search engines can index it. After adding or editing a post, run this from the repository root and commit the result:

```bash
pip install markdown
python3 scripts/build_posts.py
```

It writes `blog/<slug>/index.html` for every post, updates `feed.xml` (RSS) and adds the post URLs to `sitemap.xml`. Old `/post/#slug` links still work: they redirect to the new page.

### File naming

Use lowercase letters, numbers and hyphens, for example `my-first-post.md`. The file name (without `.md`) becomes the post address: `/post/#my-first-post`.

## Markdown features supported in posts

- Headings, paragraphs, **bold**, _italic_, ~~strikethrough~~ and links (external links open in a new tab).
- Ordered and unordered lists.
- Block quotes, shown as glass boxes with a large quote mark.
- Inline code and fenced code blocks. Each block shows its language and has a Copy button.
- Tables, which scroll sideways on small screens.
- Images, which are rounded and scale to fit.
- Horizontal rules, shown as three dots.
- **TeX math**: inline with `$...$` and display with `$$...$$`.

  ```markdown
  The transmittance follows $\ln \eta \sim \mathcal{N}(\mu, \sigma^2)$.

  $$
  T = e^{-\alpha L}
  $$
  ```

The sample post `posts/welcome-to-the-blog.md` shows every one of these. Delete it or replace it when you publish your own writing.

## Hidden short links

`/go/` is a redirect page that is **not linked anywhere** on the site: it is missing from the menu, the footer and the sitemap, and it carries a `noindex` tag so search engines skip it. Use it for short, memorable links that forward to other places, such as a CV, a paper or a profile.

Open `/go/#name` and the page looks up `name` in `links.json` and sends the visitor to the matching address:

```json
{
  "github": "https://github.com/Anand-Ambastha",
  "linkedin": "https://www.linkedin.com/in/anand-kumar05",
  "springer-paper": "https://doi.org/10.1007/s41870-025-02860-y"
}
```

With the site on GitHub Pages, these become:

| Short link | Goes to |
| --- | --- |
| `https://anand-ambastha.github.io/portfolio/go/#github` | GitHub profile |
| `https://anand-ambastha.github.io/portfolio/go/#linkedin` | LinkedIn profile |
| `https://anand-ambastha.github.io/portfolio/go/#springer-paper` | Springer paper (DOI) |

**Add a link:** add a line to `links.json` with a lowercase name (letters, numbers and hyphens) and a full `https://` address, then commit and push. The target can also be a page on this site, such as `"cv": "assets/cv.pdf"`.

**Rules:**
- Only `http` and `https` addresses are followed. Anything else shows "This link is not valid."
- An unknown name shows "Link not found" with a button back to the home page.
- The page waits a moment and then redirects. It also shows a **Continue** button in case the redirect is blocked.
- Names are not case sensitive.

## Edit the content

| To change | Edit |
| --- | --- |
| Page text, research entries, projects, publications | The `index.html` inside the matching folder |
| Contact details | `contact/index.html` (and the footers if you want them elsewhere) |
| Navigation links | The `<header class="nav">` block in each page, and the footer `<nav>` |
| Colors, fonts, spacing, star field | `assets/css/styles.css` |
| Blog behavior | `assets/js/blog.js` |
| List of blog posts | `posts/index.json` |

Navigation and footer markup is repeated in every page, so a menu change needs the same edit in all eight `index.html` files. Links from pages inside folders start with `../`.

### Add a publication

Copy an existing `<article class="row">` block in `publications/index.html` into the right section and change the year, title, venue, authors and status label. To link a preprint, thesis or slide deck, make the status label an anchor, as the journal entry does:

```html
<a class="status" href="https://example.org/paper" target="_blank" rel="noopener">Preprint ↗</a>
```

Remove the "No ... posted yet" row from a section when you add its first entry.

## Design system

All colors, fonts and the star field are defined in `assets/css/styles.css`.

**Color tokens** (at the top of the file):

| Token | Purpose |
| --- | --- |
| `--bg` | Page background (black) |
| `--surface`, `--surface-hover` | Translucent card fill and hover fill |
| `--fg` | Main text |
| `--muted` | Secondary text and labels |
| `--line`, `--glass-border` | Hairlines and glass edges |
| `--accent` | Links, small marks and the hero figure (light blue) |

**Fonts**: [Geist](https://fonts.google.com/specimen/Geist) for headings and text, and Geist Mono for labels, dates and code. Both load from Google Fonts, with system fallbacks.

**Star field**: two fixed layers (`body::before` and `body::after`) built from `radial-gradient` dots. The second layer twinkles with the `twinkle` animation. Change the dot positions or sizes there to adjust the sky.

**Glass effect**: translucent `background`, a `backdrop-filter: blur(...)`, a light border and an inset top highlight. It is used for the nav bar (`.nav .wrap`), cards, ghost buttons, quotes and code blocks.

## Deploy with GitHub Pages

1. Push this repository to GitHub.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the `main` branch and the `/ (root)` folder, then save.
5. After a minute, the site is available at `https://anand-ambastha.github.io/portfolio/`.

All links in the site are relative, so it works both at a repository path (`/portfolio/`) and on a custom domain. To use a custom domain, add it under **Settings → Pages** and follow GitHub's DNS instructions.

## Search engine optimisation

**What is in place**

- A unique `<title>` (under 60 characters) and meta description (under 160) on every page.
- A canonical address, Open Graph tags and Twitter Card tags on every public page, with a 1200 x 630 share image (`assets/img/og-image.png`) so links look good on LinkedIn, X, WhatsApp and Slack.
- JSON-LD structured data (schema.org): a `Person` and `WebSite` on the home page, `BreadcrumbList` on inner pages, a list of `ScholarlyArticle` entries on Publications, plus `ProfilePage`, `Blog` and `ContactPage`.
- `sitemap.xml` and `robots.txt`. The hidden pages (`/go/` and `/post/`) are marked `noindex`.
- One `<h1>` per page, a logical heading order, descriptive link text and a text description for the home diagram.
- Favicon, Apple touch icon, `theme-color` and a custom `404.html`.
- Fast by design: no build step, one small stylesheet, fonts loaded with `display=swap`.

**After deploying**

1. Open [Google Search Console](https://search.google.com/search-console), add the site, and submit `https://anand-ambastha.github.io/portfolio/sitemap.xml`.
2. Do the same in [Bing Webmaster Tools](https://www.bing.com/webmasters).
3. Test a link in the [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) to refresh the share preview.

**If the site address changes** (custom domain or a `Anand-Ambastha.github.io` repository), replace the old address everywhere:

```bash
grep -rl "anand-ambastha.github.io/portfolio" . --exclude-dir=.git \
  | xargs sed -i 's#https://anand-ambastha.github.io/portfolio/#https://your-new-address/#g'
```

Update `<lastmod>` in `sitemap.xml` when you change a page.

**Known limits**

- Search engines only read `robots.txt` at the root of a domain. On a project site (`/portfolio/`) it is ignored, so the sitemap must be submitted in Search Console. A custom domain or a repository named `Anand-Ambastha.github.io` fixes this.
- Blog posts all open at `/post/#post-name`. Search engines treat the part after `#` as the same page, so individual posts are not indexed. Pre-rendering each post as its own page would fix this.

## How the blog works

The blog has no server and no build step. Everything happens in the visitor's browser:

1. `blog/index.html` and `post/index.html` load `assets/js/blog.js`.
2. The script fetches `posts/index.json`, then fetches each listed `.md` file.
3. It reads the front matter (title, date, tags, summary) and estimates reading time at 200 words per minute.
4. `/blog/` draws the post cards and tag filters.
5. `post/index.html` reads the post address from the URL hash (`#post-slug`), converts the Markdown to HTML with `marked`, cleans it with `DOMPurify`, adds code-block headers, wraps tables, and renders math with `MathJax`.
6. Links to newer and older posts appear at the bottom.

Math is protected before Markdown conversion so that underscores and backslashes in TeX are not changed, then restored for MathJax.

## Third-party libraries

Loaded from [cdnjs](https://cdnjs.com/) on the post page only:

| Library | Version | Purpose |
| --- | --- | --- |
| [marked](https://marked.js.org/) | 4.3.0 | Markdown to HTML |
| [DOMPurify](https://github.com/cure53/DOMPurify) | 3.0.6 | Sanitizes rendered HTML |
| [MathJax](https://www.mathjax.org/) | 3.2.2 (`tex-svg`) | TeX math rendering |

The home and blog pages need none of these. Fonts load from Google Fonts.

## Browser support

Current versions of Chrome, Edge, Firefox and Safari. The glass effect uses `backdrop-filter`; in a browser without it, the bar and cards fall back to a flat translucent fill and stay readable.

## Troubleshooting

| Problem | Cause and fix |
| --- | --- |
| Blog shows "Posts could not be loaded" | The page was opened with `file://`. Serve the folder (see [Run locally](#run-locally)). |
| A new post does not appear | Check that its file name is in `posts/index.json`, the JSON is valid (commas, quotes) and the post does not have `draft: true`. |
| A post shows "Post not found" | The address does not match the file name. Use lowercase letters, numbers and hyphens. |
| Math shows as raw TeX | MathJax did not load. Check the connection, then reload. Make sure `$` has no space just inside it, as in `$x$`. |
| Post images do not load | Put images in `posts/img/` and link them as `img/name.png`, with matching capitalization. |
| Styles are missing on GitHub Pages | Confirm the `assets/` folder was pushed and that Pages is serving the `/ (root)` folder. |

## License

No license has been chosen yet. Until one is added, all rights are reserved by the author. Add a `LICENSE` file to allow reuse.
