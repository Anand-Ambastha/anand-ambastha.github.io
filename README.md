# Anand Kumar · Portfolio

Personal research portfolio for Anand Kumar: quantum communications, free-space optical (FSO) channel modeling and satellite/NTN systems.

A static site with no build step. Plain HTML, CSS and a little JavaScript.

## Structure

```
.
├── index.html            Home
├── research.html         Research positions and results
├── projects.html         Projects
├── publications.html     Papers, preprints, thesis and reports, slides
├── blog.html             Blog listing with tag filter
├── post.html             Single blog post (post.html#post-slug)
├── about.html            Bio, education, skills, leadership
├── contact.html          Contact details
├── assets/
│   ├── css/styles.css    Shared styles (design tokens at the top)
│   └── js/blog.js        Blog engine: loads and renders Markdown posts
└── posts/
    ├── index.json        List of post files, one name per entry
    ├── *.md              Blog posts
    └── img/              Images used in posts
```

## Run locally

Browsers block `fetch()` from `file://`, so serve the folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Write a blog post

1. Create `posts/my-post.md` with a front matter block:

   ```markdown
   ---
   title: Your title
   date: 2026-10-20
   tags: [qkd, turbulence]
   summary: One or two sentences for the post card.
   ---

   Your post in Markdown.
   ```

2. Add the file name to `posts/index.json`:

   ```json
   ["my-post.md", "welcome-to-the-blog.md"]
   ```

3. Put images in `posts/img/` and link them as `![Alt text](img/figure.png)`.

Add `draft: true` to the front matter to hide a post until it is ready. Posts support code blocks, tables, quotes and TeX math between dollar signs (`$...$` and `$$...$$`).

## Deploy with GitHub Pages

In the repository settings, open **Pages**, choose **Deploy from a branch**, then select `main` and `/ (root)`.

Blog rendering loads `marked`, `DOMPurify` and `MathJax` from cdnjs on `post.html`.

## Edit the content

- Page text lives in each `.html` file.
- Colors, fonts and spacing are CSS variables at the top of `assets/css/styles.css`.
- Update the list of posts in `posts/index.json`.
