---
title: An SNS-TF-QKD link in OptiSystem, and the Python pipeline that reads its logs
date: 2026-10-15
category: project
tags: [optisystem, sns-tf-qkd, matlab, python]
summary: How I built a physical-layer sending-or-not-sending twin-field QKD prototype in OptiSystem with MATLAB co-simulation, and the Python pipeline that turns its CSV logs into a key rate.
---

My internship at the Scientific Analysis Group of the Defence Research and Development Organisation had two halves. The satellite half became [QSAFire](../post/#qsafire-satellite-sns-tf-qkd-simulator). The other half was smaller and more hands-on: a 40 km fibre version of the same protocol, built at the level of lasers, modulators and detectors in OptiSystem, plus a Python pipeline that reads what that prototype logs. The two halves share no code, data or file format. This post covers the second half. The code and documentation are in the `osd` folder of the [QSAFIRE repository](https://github.com/Anand-Ambastha/QSAFIRE/tree/main/osd), and the full description is in the [internship report](https://github.com/Anand-Ambastha/QSAFIRE/blob/main/Summer_Internship_Report_DRDO.pdf).

## The protocol, briefly

In twin-field QKD, Alice and Bob each send weak pulses to a middle station, Charlie, who interferes them on a beam splitter. A single click at one of Charlie's two detectors links their bits, and the key rate scales with the square root of the total channel transmittance, not with the full transmittance. That is how it gets past the limit for repeaterless point-to-point links.

The original proposal had a gap. Its bit values were encoded in a global phase that has to be disclosed later, and Wang, Yu and Hu showed that this leaves room for an attack. Their **sending-or-not-sending (SNS)** protocol removes the gap by changing where the bit comes from. In the key-generating Z windows, each party privately decides to send a pulse of intensity μ′ (with probability ε) or send nothing. That decision is the bit, and no phase for those pulses is ever announced. A separate set of X windows carries phase-randomised decoy pulses, used only to estimate how much of the signal is single-photon and what its phase error is. The prototype is built around exactly this split.

## The layout

Three stations are connected by four spans of standard single-mode fibre (SMF-28), each 40 km long, two per user. Alice and Bob are mirror images. Each has a Z branch and an X branch, fed by a shared stream of window-selection bits. At Charlie, a 50:50 coupler combines the two fields for each basis, and a pair of single-photon detectors watches its two outputs.

| Parameter | Value |
| --- | --- |
| Bit rate | 10 Gbit/s |
| Sequence length | 1,024 bits per run |
| Samples per bit | 32 (320 GSa/s) |
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

The hand-off is five CSV files: records for Alice, for Bob and for Charlie's X and Z detectors, plus an X-basis log kept at Charlie. They are joined on a window index. Two rules matter here. Every window gets a row, including the windows with no click, because the gain is clicks divided by windows sent and dropping the empty rows would corrupt the denominator. And each block writes one row per window, not one per waveform sample, or the 32 samples per bit would produce 32 rows per bit.

## The Python pipeline

The pipeline reads the five files and applies the post-processing that the SNS security analysis requires:

1. **Synchronise and check.** Row counts, duplicate indices and missing columns are verified across all five files.
2. **Separate the bases.** Windows where Alice and Bob chose different bases are dropped.
3. **Select X-basis phases.** Matching decoy intensities are kept, and a pair is accepted only if 1 − |cos(δ_A − δ_B)| ≤ |λ|, using a discretised phase slice.
4. **Estimate with decoys.** A two-decoy lower bound on the single-photon yield and an upper bound on its phase error.
5. **Z-basis gain and error rate.** Windows are split into four categories by who sent: Alice only, Bob only, both, or neither. Only the first two carry genuine key bits.
6. **Key rate.** The final rate is computed with every term reported, and a 95% Wilson confidence interval on each rate estimated from a finite count.

## What it returned

I ran the pipeline end to end on the one set of CSV files I had. It finished without error and returned a negative key rate. In the report I traced this to the data, not the code: the detector clicks in that set did not appear statistically coupled to the underlying phase and send/not-send variables. A negative key rate here means no secret key can be extracted from that run, so it is a result I would sooner publish than hide. It also limits what the prototype can claim. The next step I recommended is to validate the pipeline on a properly noise-calibrated simulation run, so that a known-good dataset gives a known-good rate.

## What I would change

- **A longer link.** 40 km and 1,024 bits per run are chosen to keep the simulation fast. The advantage of TF-QKD shows up at hundreds of kilometres, where active phase tracking at Charlie matters.
- **More windows.** 1,024 windows are far too few for tight decoy-state bounds, so a real study would sweep many runs and concatenate their logs.
- **Finite-key bounds.** The estimates are asymptotic. Confidence-interval widening would give a rate that can be defended for a finite sample.
- **Detector realism.** Dark counts, dead time and afterpulsing would show how much of the rate they take away.

If you work on twin-field QKD or on simulation workflows for it, [get in touch](../contact/). My other projects are on the [Projects page](../projects/).
