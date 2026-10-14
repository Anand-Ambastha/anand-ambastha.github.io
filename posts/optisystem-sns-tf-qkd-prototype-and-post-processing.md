---
title: An SNS-TF-QKD link in OptiSystem, and the Python pipeline that reads its logs
date: 2026-10-15
category: project
tags: [optisystem, sns-tf-qkd, matlab, python]
summary: How I built a physical-layer sending-or-not-sending twin-field QKD prototype in OptiSystem with MATLAB co-simulation, and the Python pipeline that turns its CSV logs into a key rate.
---

My internship at the Scientific Analysis Group of the Defence Research and Development Organisation had two halves. The satellite half became [QSAFire](../post/#qsafire-satellite-sns-tf-qkd-simulator). The other half was smaller and more hands-on: a 40 km fibre version of the same protocol, built at the level of lasers, modulators and detectors in OptiSystem, plus a Python pipeline that reads what that prototype logs. The two halves share no code, data or file format. This post covers the second half. Everything is in the `osd` folder of the [QSAFIRE repository](https://github.com/Anand-Ambastha/QSAFIRE/tree/main/osd): the OptiSystem project files, the MATLAB blocks, the exported CSV logs and the post-processing notebook, which also runs in [Google Colab](https://colab.research.google.com/drive/1NHLbkTHHAY6hFgKvyQyOSZjMTd9DnaTz?usp=sharing). The full description is in the [internship report](https://github.com/Anand-Ambastha/QSAFIRE/blob/main/Summer_Internship_Report_DRDO.pdf).

## The protocol, briefly

In twin-field QKD, Alice and Bob each send weak pulses to a middle station, Charlie, who interferes them on a beam splitter. A single click at one of Charlie's two detectors links their bits, and the key rate scales with the square root of the total channel transmittance, not with the full transmittance. That is how it gets past the limit for repeaterless point-to-point links.

The original proposal had a gap. Its bit values were encoded in a global phase that has to be disclosed later, and Wang, Yu and Hu showed that this leaves room for an attack. Their **sending-or-not-sending (SNS)** protocol removes the gap by changing where the bit comes from. In the key-generating Z windows, each party privately decides to send a pulse of intensity μ′ (with probability ε) or send nothing. That decision is the bit, and no phase for those pulses is ever announced. A separate set of X windows carries phase-randomised decoy pulses, used only to estimate how much of the signal is single-photon and what its phase error is. The prototype is built around exactly this split.

## The layout

Three stations are connected by four spans of standard single-mode fibre (SMF-28), each 40 km long, two per user. Alice and Bob are mirror images. Each has a Z branch and an X branch, fed by a shared stream of window-selection bits. At Charlie, a 50:50 coupler combines the two fields for each basis, and a pair of single-photon detectors watches its two outputs.

| Parameter | Value |
| --- | --- |
| Bit rate | 10 Gbit/s |
| Sequence length | 1,024 bits per run |
| Samples per bit | 32 (320 GSa/s), so 32,768 samples per run |
| Signal pulse (Z windows) | mean photon number μ′ = 0.1 |
| Decoy pulses (X windows) | μ₁ = 0.05 and μ₂ = 0.2, plus vacuum, drawn with probabilities 0.4, 0.4 and 0.2 |
| Phase slices | M = 16 |
| Laser | 193.1 THz (about 1552.52 nm), 0 dBm |
| Fibre | 4 × 40 km SMF-28 |

At 0.2 dB/km, each 40 km span loses about 8 dB.

## Putting protocol logic into a physical simulator

OptiSystem models light, fibre and detectors well. It has no block for "with probability ε, do not send this symbol", or for "pick one of three decoy intensities from this distribution and log the choice". So that logic lives in MATLAB co-simulation blocks, which sit in the signal path as programmable taps:

- **Window selection** reads a pseudo-random bit and labels each window Z or X.
- **SNS logic** (Z windows) draws send or not-send and gates the pulse accordingly, with the bit value assigned from that decision.
- **Decoy estimation** (X windows) picks a signal, weak-decoy or vacuum intensity.
- **Random phase** draws a phase uniformly in [0, 2π) and drives the phase modulator.
- **CSV logging** at Charlie writes down what the detectors saw.

Two details are easy to get wrong. Bob's bit convention is the complement of Alice's (send means 1 for Alice and 0 for Bob), so that a good key window is one where their bits differ. And Alice's and Bob's random streams must be independently seeded, otherwise their correlated choices would invent agreement that no physical process produces.

## Keeping the simulation honest

The design rule is that nothing inside OptiSystem computes a key. The simulator only produces physical-layer events and logs them. Sifting, error rates, decoy-state bounds and the key rate all happen afterwards in Python. This keeps the physical model from using information a real Charlie or Eve would not have, such as Alice's private send decision. It also means one expensive simulation run can be analysed again under different protocol assumptions.

The hand-off is five CSV files: records for Alice, for Bob and for Charlie's X and Z detectors, plus an X-basis log kept at Charlie. They are joined on a window index, and in these logs a window is one sample of the run, so each file has 32,768 rows. The rule that matters most is that every window gets a row, including the windows with no click, because the gain is clicks divided by windows sent and dropping the empty rows would corrupt the denominator.

## The Python pipeline

The pipeline reads the five files and applies the post-processing that the SNS security analysis requires:

1. **Synchronise and check.** Row counts, duplicate indices and missing columns are verified across all five files.
2. **Separate the bases.** Windows where Alice and Bob chose different bases are dropped.
3. **Select X-basis phases.** Matching decoy intensities are kept, and a pair is accepted only if 1 − |cos(δ_A − δ_B)| ≤ |λ|, using a discretised phase slice.
4. **Estimate with decoys.** A two-decoy lower bound on the single-photon yield and an upper bound on its phase error.
5. **Z-basis gain and error rate.** Windows are split into four categories by who sent: Alice only, Bob only, both, or neither. Only the first two carry genuine key bits.
6. **Key rate.** The final rate is computed with every term reported, and a 95% Wilson confidence interval on each rate estimated from a finite count.

## What it returned

The pipeline runs end to end on the logs in the repository, and its checks pass: all five files have 32,768 rows, no duplicate window indices, no missing columns, and every window appears in every file. Then the numbers show that the data carries no key:

| Quantity | Value |
| --- | --- |
| Windows where Alice and Bob chose the same basis | 17,248 of 32,768 (about 53%, as expected for independent choices) |
| X windows, both parties, same decoy intensity | 3,464 |
| Of those, accepted by the phase-slice rule | 215 (6.97%, close to the 1/16 expected for random phases) |
| Z windows with a single detector click | 1,458 of 7,712 |
| Z-basis error rate | 0.59 |
| X-basis detector error rate | 0.51 (22 of 43) |
| Phase-error bound from the decoy estimate | −0.93, which is outside the valid range of 0 to 1 |
| Secret key rate (Eq. 4 of Wang et al.) | −0.20 per window pair |

An error rate of 0.59 is worse than guessing, and a phase-error bound below zero is not physically meaningful. Both are the signature of detector clicks that are not statistically coupled to the phase or to the send decisions that are supposed to cause them. So the negative key rate is a property of this dataset, and I traced it to the data in the report, not to the pipeline. The pipeline does what it should, and reports an invalid bound as invalid. I would rather show that than a flattering number. The next step I recommended is to validate the pipeline on a properly noise-calibrated simulation run, so that a known-good dataset gives a known-good rate.

## What I would change

- **A longer link.** 40 km and 1,024 bits per run are chosen to keep the simulation fast. The advantage of TF-QKD shows up at hundreds of kilometres, where active phase tracking at Charlie matters.
- **More accepted events.** Only 215 X windows survive the phase rule, which makes every X-basis estimate noisy. A real study would sweep many runs and concatenate their logs.
- **Finite-key bounds.** The estimates are asymptotic. Confidence-interval widening would give a rate that can be defended for a finite sample.
- **Detector realism.** Dark counts, dead time and afterpulsing would show how much of the rate they take away.

If you work on twin-field QKD or on simulation workflows for it, [get in touch](../contact/). My other projects are on the [Projects page](../projects/).
