---
title: Five months, one micro project, and Aayush
date: 2026-11-21
tags: [college, fpga, teamwork]
summary: The part of my B.Tech micro project that isn't in the report: three reviews, an FPGA board that stayed in its box, and working with a partner who is never bothered by anything.
---

Aayush and I just finished our B.Tech micro project, a [hardware-assisted post-processing chain for SNS-TF-QKD](../post/#hardware-assisted-post-processing-sns-tf-qkd-micro-project) (Aayush Gupta is my partner on it). The technical story is in that post and in the report. This one is about everything the report leaves out.

Five months. Three reviews. And a plan that every single time ended with "and then we'll put it on the FPGA."

We didn't. Diwali and the festive weeks came, the lab was shut right when we needed it, and the board never left its box. I'd love to blame only the calendar, but honestly, a good chunk of it was us. We kept saying "there's time" and then it was November. Classic.

Working with Aayush is the best part of this whole project, and also the hardest. He's my Leonard. Calm, always up for the work, never bothered by anything. That's brilliant when a simulation crashes. It's less brilliant when I'm freaking out about a review and he just goes "yeah, it'll be fine." And it was fine. Every time. I still can't decide whether to be grateful or annoyed, so I'm both.

And his calm isn't the peaceful kind. It's the "abhi time hai" kind. Every few days it went the same way. He'd ask, "micro karna hai?" I'd say, "haan, kar le." And he'd say, "rehne de, abhi time hai." :)

Every. Single. Time. Always with a smile, never with a plan. The worst part is that I'd nod and agree, because honestly I wanted it to be true. We'd both walk away feeling very responsible for having had the conversation.

That makes me the difficult one, I guess. I'll take it. For the record, here's how I'd like the project remembered:

- "I'm not procrastinating, I'm letting the problem mature." (The board run, September to November.)
- "The lab is closed for the festival? That's an unacceptable schedule and I'm going to write to someone." (I wrote to nobody.)
- "A negative key rate isn't a failure, it's an honest result about the noise." (Aayush nodded and kept eating.)
- "All 19 counters match the reference model exactly. Applause is optional but encouraged."
- "Three reviews? Three? One review and a nervous stomach used to be enough." (Last year. That was last year.)
- "We'll run it on the board next week." (Said weekly. The board has probably started laughing.)

Aayush's answer to every one of these is "okay." Same voice, every time. Best counter-argument I've ever met, and I have never once won.

## What actually got done

Here's the thing, though. Despite all the "abhi time hai", the work did get done. The OptiSystem link runs. The Python pipeline runs end to end and tells the truth, even when the truth is a negative key rate. The Verilog core matches the reference model on all 19 counters. The report, the slides and the poster exist. It just all happened in the last stretch instead of spread over five months, which is a very specific, very student way of doing a project.

The reviews were oddly useful for that. Each one was a small wall we ran into at speed. Before a review we'd suddenly be very productive, and after it we'd go back to being relaxed until the next one approached. If you want a schedule for how this team works, it's a sine wave with the reviews as the peaks.

I'll also say this, since nobody else will: it's easier to be stressed alone than to be stressed next to someone who isn't. Aayush's calm, annoying as it was, kept the project from turning into a panic. Some of those weeks I needed exactly that, and I didn't say so at the time. So, Aayush, if you're reading this: thanks, and also please start earlier next time. We both know you won't.

If you're doing something like this, my only advice: book the lab early and write the date of your first board run somewhere you can't ignore it. Software waits for you. A closed lab doesn't.

The technical write-up is [here](../post/#hardware-assisted-post-processing-sns-tf-qkd-micro-project) if you want the counters, the Verilog and the numbers. The board run is still on the list.
