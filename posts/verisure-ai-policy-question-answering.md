---
title: VeriSure AI, asking plain questions of insurance policies
date: 2026-10-15
category: project
tags: [verisure-ai, rag, faiss, gemini]
summary: How a hackathon prototype turns uploaded policy documents into a question-answering tool that cites the clauses behind each answer.
---

Insurance policies are long, and the answer to a simple question such as "is cataract surgery covered?" sits in one clause on page 31. VeriSure AI is a prototype I built for the HackRx 6.0 problem statement from the Bajaj Finserv Hackathon. You upload one or more policy documents, ask a question in plain language, and get back a structured decision with the clauses it relied on. The entry on the [Projects page](../projects/) has the short version, and the code is on [GitHub](https://github.com/Anand-Ambastha/VeriSure-AI).

## The idea in one paragraph

A language model should not be asked to read a whole policy and answer from memory. Instead, the system first finds the few clauses that matter for the question, and then asks the model to decide using only those clauses. This pattern is usually called retrieval-augmented generation. It keeps the model's answer tied to text the user can check.

## How a question travels through it

1. **Upload.** The `/upload_docs` endpoint accepts PDF and DOCX files, extracts their text and splits it into chunks.
2. **Embed and index.** Each chunk is turned into a vector with a MiniLM sentence-transformer, and the vectors go into a FAISS index saved in a folder for that session.
3. **Retrieve.** The `/query` endpoint takes the question and the session ID, embeds the question, and pulls the most similar clauses from that session's index.
4. **Decide.** The clauses and the question go to Gemini 1.5 Flash, which replies with a JSON object.

For the cataract question, the system returned this:

```json
{
  "decision": "rejected",
  "amount": null,
  "justification": "The provided policy clauses do not contain any information regarding coverage for cataract."
}
```

The interface also lists the clauses the model was shown, so a reader can see what the answer was based on.

## The stack

| Part | Choice |
| --- | --- |
| Backend | FastAPI |
| Embeddings | Sentence-Transformers, MiniLM |
| Vector search | FAISS |
| Reasoning | Gemini 1.5 Flash |
| Frontend | Streamlit |
| Storage | One folder per session under `data/` |

## Two versions

Version 1 handled a single document and kept the FAISS index in one fixed place. Version 2 accepts several documents in one session and creates a new index folder for each session, named by timestamp. That keeps one user's documents from mixing with another's, and the stored session ID links the upload step to the questions that follow. The front end runs the whole loop, from upload to question to answer.

## What a "rejected" answer means

In the example above, "rejected" means the retrieved clauses did not mention cataract surgery. It does not mean a claim was assessed and refused. A real claims decision depends on exclusions, waiting periods and the policy schedule, which a handful of retrieved clauses may not include. I would treat the output as a fast first reading that points the user to the right text, not as a decision.

## What I would add

- Login and saved session history for each user
- Highlighting of the source lines in the document itself
- Exportable reports in PDF and JSON
- A dashboard of trends across policies

The project includes a Procfile for deployment on Railway. If you work on document question answering, or have a policy corpus you would like to try it on, [get in touch](../contact/). My other projects are on the [Projects page](../projects/).
