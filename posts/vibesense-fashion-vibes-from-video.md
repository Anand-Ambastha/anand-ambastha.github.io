---
title: VibeSense, finding the products and the vibe in a short video
date: 2026-10-15
category: project
tags: [vibesense, computer-vision, clip, faiss]
summary: How a hackathon backend finds clothing items in a reel, matches them to a product catalog and names the aesthetic of the look.
---

Fashion now spreads through short videos. A viewer sees a look in a reel and wants two things: where to buy the pieces, and what the style is called. VibeSense is the backend engine I built for the Flickd AI Hackathon 2025 to answer both. Give it a short video and a caption, and it returns the products it recognises and the vibes the look carries, such as Coquette, Streetwear or Vintage. The entry on the [Projects page](../projects/) has the short version, and the code is on [GitHub](https://github.com/Anand-Ambastha/VibeSense).

## Two questions, two paths

The system treats the picture and the caption separately and joins them at the end.

**What is being worn?** Frames are pulled from the video with FFmpeg. A YOLOv8n detector finds clothing in each frame, and each detected item is cropped out. A CLIP model turns every crop into an embedding, and FAISS searches a pre-built catalog of product images for the closest matches by cosine similarity.

**What is the style?** The caption is read from a text file with the same name as the video. A sentence-transformer embeds it and compares it with a list of vibe descriptions, which gives the vibe tags.

## The models, and why

| Stage | Model | Role |
| --- | --- | --- |
| Detection | YOLOv8n | Fast detection and cropping of clothing items |
| Image embedding | CLIP ViT-B/32 | Semantic image vectors for visual similarity |
| Text embedding | all-MiniLM-L6-v2 | Compact vectors for captions and product text |
| Matching | FAISS, cosine similarity | Nearest products across the catalog |

YOLOv8n was trained on the Fashionpedia dataset, which has 45 clothing categories with detailed annotations. The training notebook is in the repository. I chose small models on purpose: the goal was a lightweight pipeline that runs from the command line, not a large system that needs a server.

## What comes out

The result is one JSON file per video:

```json
{
  "video_id": "2025-05-27_13-46-16_UTC",
  "vibes": ["Coquette", "Clean Girl", "Boho"],
  "products": [
    {
      "Product_ID": "15581",
      "type": "Shirt",
      "color": "Grey",
      "match_type": "Similar Match",
      "confidence": 0.8543
    }
  ]
}
```

Each product has a type, a colour, a match type and a confidence score, so a downstream tool can decide how sure it needs to be before it shows a link.

## Running it

Put a video and its caption in `videos/` with the same file name, then run:

```bash
python main.py
```

The results appear in `outputs/`. The repository also holds the extracted frames, the crops and the evaluation JSON files from my runs.

## Where it is limited

- The vibe step depends on the caption. A video with no caption, or a caption that says nothing about style, gives weak vibe tags.
- Matching is only as good as the catalog. A garment that is not in the catalog can only be matched to something similar.
- A hackathon timeline meant I measured the pipeline on a small set of videos, so treat the confidence scores as a ranking aid and not as calibrated probabilities.

If you work on visual search or short-video understanding and want to compare notes, [get in touch](../contact/). My other projects are on the [Projects page](../projects/).
