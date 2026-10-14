---
title: Welcome to the blog
date: 2026-10-14
tags: [meta, markdown]
summary: A sample post that shows how Markdown is styled on this site. Replace it with your own writing.
---

This is a sample post. It shows how each piece of Markdown looks on this site, so you can see what you get before writing your own. Delete or replace it whenever you like.

## Headings and text

Write in plain Markdown. You can use **bold**, *italic*, ~~strikethrough~~ and [links](https://github.com/Anand-Ambastha). Second-level headings like the one above start new sections.

### Lists

- Free-space optical links lose signal to **absorption**, **scattering** and **turbulence**.
- Satellite passes are short, so key-rate estimates depend on the elevation profile.
- Decoy states let you bound the single-photon contribution.

1. Model the channel.
2. Estimate the error rates.
3. Compute the secret-key rate.

> Tip: start each post with a short paragraph that says what the reader will learn. It also becomes the opening text of the post.

## Code

Fenced code blocks get a language label and a copy button.

```python
import numpy as np

mu, sigma = np.log(0.01), 0.4
eta = np.exp(np.random.default_rng(0).normal(mu, sigma, 200_000))
print(eta.mean(), np.exp(mu + sigma**2 / 2))
```

Inline code such as `np.exp` is highlighted too.

## Math

Wrap TeX in dollar signs. Inline math looks like $\ln \eta \sim \mathcal{N}(\mu, \sigma^2)$, and display math goes on its own lines:

$$
T = e^{-\alpha L}
$$

## Tables

| Markdown | What you type |
| --- | --- |
| Heading | `## Title` |
| Bold | `**text**` |
| Image | `![alt text](img/figure.png)` |

## Images

Put image files in the `posts/img/` folder and link them like `![Link budget](img/link-budget.png)`.

---

## Front matter

Every post starts with a short block between two `---` lines. It sets the title, date, tags and summary. Add `draft: true` to hide a post until it is ready.
