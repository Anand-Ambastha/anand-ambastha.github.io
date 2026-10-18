---
title: How to write and publish a post on this site
date: 2026-10-15
tags: [how-to, website]
summary: The steps for adding a blog post to this portfolio: the file, the front matter, images, the build step, and how to keep it as a draft until it is ready.
draft: true
---

This is a short guide to my own workflow, kept as a draft so it stays off the Blog page. It lives in the repository next to the posts it describes.

## 1. Create the file

Add a Markdown file to `posts/`. The file name becomes the address, so use lowercase letters, numbers and hyphens: `posts/my-new-post.md` is published at `/blog/my-new-post/`.

Start the file with a front matter block:

```markdown
---
title: A clear, specific title
date: 2026-10-20
tags: [qkd, satellite]
summary: One or two sentences for the post card and search results.
category: project
draft: true
---
```

- `title` and `date` are required. Posts are sorted newest first.
- `tags` become the filter chips on the Blog page.
- `category: project` lists the post under **Project blogs**. Leave it out and the post appears under **My thoughts**.
- `draft: true` hides the post everywhere until it is ready. Delete the line, or set it to `false`, to publish.

## 2. Register it

Add the file name to `posts/index.json`. A post that is not listed there is never loaded.

## 3. Write

Plain Markdown works: headings, lists, tables, block quotes, code blocks with a Copy button, and images. Maths goes between dollar signs for inline use and double dollar signs for a display equation. Keep claims tied to numbers from your own reports or runs, and link the repository or paper they come from.

Images go in `posts/img/` and are linked relative to the posts folder, for example `![Link budget](img/link-budget.png)`. Give each image a short description for people who cannot see it.

## 4. Build the static page

Each post also gets its own static page so search engines can index it. From the repository root, run:

```bash
pip install markdown
python3 scripts/build_posts.py
```

The script writes `blog/<slug>/index.html`, refreshes `feed.xml` and updates the post URLs in `sitemap.xml`. Drafts are skipped, so a draft produces no public page.

## 5. Check it locally

Serve the folder with `python3 -m http.server` and open the Blog page. A draft will not show there. To see how a draft reads, set `draft: false` on your machine, look at it, then switch it back before committing.

## 6. Publish

1. Remove `draft: true`.
2. Run the build script again.
3. Commit the post, the generated `blog/<slug>/` folder, `feed.xml` and `sitemap.xml`, then push to `main`.

GitHub Pages deploys within a minute or two. After that, request indexing for the new URL in Search Console if you want it picked up sooner.

## Checklist before removing the draft flag

- The title says what the post is about.
- Every number can be traced to a report, a run output or a paper.
- Links to repositories and papers work.
- Images have descriptions.
- The summary reads well on its own.
