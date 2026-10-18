---
title: DeepSpeak, building a chatbot from a person's own words
date: 2026-10-15
category: project
tags: [deepspeak, nlp, whisper, hackathon]
summary: A look at a CodeClash 2.0 hackathon project that turns messages, photos and voice notes into a conversational persona, and the questions it raises.
---

DeepSpeak was our entry at CodeClash 2.0. The idea is to help someone keep a loved one's way of speaking: you upload messages, photos and voice notes, and the system builds a chatbot that answers in that person's style. It was a team of four. Naivedya Giri, Krish Tanwar and Vasu Chaudhary built the front end and the full-stack parts, and I built the AI component. The entry on the [Projects page](../projects/) has the short version, and the code is on [GitHub](https://github.com/Anand-Ambastha/DeepSpeak).

## What goes in

The system accepts three kinds of material about one person:

- **Text**, such as chat exports, and screenshots of messages that are read with Tesseract OCR
- **Voice recordings**, which Whisper turns into text
- **Photos**, used to build a visual profile

Everything is converted to text or features, because the chatbot works from language.

## From material to persona

My part was the analysis that sits between the raw files and the chatbot.

1. **Extraction.** OCR and transcription turn images and audio into text, alongside the text that was uploaded directly.
2. **Personality analysis.** The text is analysed for emotional tone, vocabulary and common phrases, so the persona has a recognisable voice.
3. **Visual profile.** Face detection and landmark checks, using the `face_recognition` library and OpenCV, assess the uploaded photos.
4. **Chatbot.** A GPT-style model, with OpenAI, DeepSeek or Gemini as the options, is prompted with the extracted profile and answers in character.
5. **Portraits.** Stable Diffusion can generate a portrait from a name and a style.

Profiles and chat history are stored in SQLite, and a profile can be exported as a JSON file.

## The stack

| Part | Technology |
| --- | --- |
| Interface | Streamlit |
| API | FastAPI with Uvicorn |
| Language models | OpenAI, DeepSeek or Gemini |
| Audio | Whisper |
| OCR | Tesseract |
| Vision | face_recognition, OpenCV, PIL |
| Image generation | Stable Diffusion through `diffusers` |
| Storage | SQLite through SQLAlchemy |

The app has five screens: upload and create, chat, profile viewer, image generation, and export. It was deployed on Vercel.

## Questions this kind of project raises

A hackathon gives you a weekend, not enough time to settle the hard questions, and I do not think any single prototype can. They are still worth stating plainly:

- Whose data is it, and who is allowed to upload it?
- How clearly should the interface say that the replies come from a model and not from the person?
- What should happen to the data when a user wants it removed?

The sentence that framed our project was that we cannot bring anyone back, but we can remember how they spoke. I think that is the right ambition, and it is also the reason these questions need answers before a tool like this is released to the public.

## Notes on the repository

The project was built in rounds. The first README was drafted with ChatGPT as a placeholder for the first presentation, with a plan to rewrite it before the final round, so read its feature list as the design we were aiming at. The repository also holds the presentation deck from round one and a workflow diagram.

If you want to talk about voice, language and personalisation systems, [get in touch](../contact/). My other projects are on the [Projects page](../projects/).
