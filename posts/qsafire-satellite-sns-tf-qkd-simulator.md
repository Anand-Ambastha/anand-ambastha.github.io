---
title: QSAFire, a satellite SNS-TF-QKD simulator built layer by layer
date: 2026-10-15
category: project
tags: [qsafire, sns-tf-qkd, satellite-qkd, simulation]
summary: How I built QSAFire during my internship at DRDO's Scientific Analysis Group, and why every stage of the link budget is checked against an outside reference.
---

During my summer internship at the Scientific Analysis Group of the Defence Research and Development Organisation, I built a simulator that answers one question. How much secret key can a ground station share with a satellite, and how does that change with the sky, the hardware and the weather? The result is **QSAFire**, an open-source Python package for sending-or-not-sending twin-field quantum key distribution (SNS-TF-QKD). This post explains how it is put together and what I would still improve. The project entry is on the [Projects page](../projects/), and the code is on [GitHub](https://github.com/Anand-Ambastha/QSAFIRE/tree/main/qsafire).

## The protocol

SNS-TF-QKD lets two distant parties send weak pulses to a middle station. Each party decides in every time window whether to send or not send, which tolerates a large misalignment error between the two arms. QSAFire implements the asymptotic key-rate formula from Wang, Yu and Hu, *Sending or not sending: Twin-field quantum key distribution with large misalignment error*, Phys. Rev. A 98, 062323 (2018).

The package runs the same protocol over three kinds of channel:

| Channel | What it models |
| --- | --- |
| Fiber | A standard telecom-fiber point-to-point link |
| Free space | A near-ground optical link with Gamma-Gamma scintillation |
| Ground to satellite | An uplink to a sun-synchronous satellite, from orbit to detector |

## One copy of the physics

The first rule I set was that the rate equations exist in exactly one place. The photon-number weights, the gain and error model, the decoy-state bounds and the key-rate formula all live in a single module, `src/engine.py`. The fiber, free-space and satellite models import them unchanged. Gamma-Gamma fading works the same way: it lives in `src/fso/channel_models.py`, and every layer above it reuses that code.

This matters more than it sounds. When a number looks wrong in a long pipeline, there is only one place where the protocol could be at fault. The satellite layers build on the validated fiber and free-space core and never re-derive it.

## The satellite link, layer by layer

The satellite model is split into layers that can each be tested on their own:

- **Geometry.** WGS-84 geodesy and a solved sun-synchronous orbit, with look angles along the pass. The orbit is computed from the design requirements instead of assumed.
- **Atmosphere.** Rayleigh, aerosol and gas optical depth at zenith, scaled to the slant path with the Kasten and Young airmass formula.
- **Turbulence.** A Hufnagel-Valley $C_n^2(h)$ profile, the Fried parameter, and the spherical-wave Rytov variance for an uplink.
- **Seasons.** Winter, summer and monsoon aerosol and turbulence datasets.
- **Hardware.** Diffraction loss from the Friis equation, Gaussian pointing jitter, a characterised avalanche photodiode, and day and night background light.
- **Optimisation.** A Monte Carlo ensemble that folds turbulence fading into the real-loss channel, and a joint search over signal intensity, decoy intensity and sending probability.
- **Availability.** Weather-gated annual availability from rainy-day and fog climatology.
- **Links.** A six-city database and a fully asymmetric, per-arm version of the rate formulas, for links where the two ground stations see different channels.

> The turbulence layer is where I found a real error. A plane-wave Rytov variance had been used where an uplink needs the spherical-wave form. I corrected it and re-ran the whole framework end to end to confirm the fix.

## Checking each stage against something outside the code

A simulator that only agrees with itself proves little, so every stage is compared with an external reference: a published formula, a textbook target, a reported link budget, or an internal algebraic identity. The Gamma-Gamma average is computed two ways, with Gauss-Laguerre quadrature and with direct Monte Carlo sampling, and the two must agree. The orbital solver and the elevation to slant-range formulas were checked against Landsat-8 and 9, Sentinel-2 and published Micius data, and agree to within 1 to 3 percent.

The full list of checks is in `docs/theory.md` in the repository.

## Running it

The pipelines are plain scripts, and there is a Streamlit dashboard over the whole satellite chain.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

python scripts/run_part3_to_13_satellite.py --no-plots   # full satellite pipeline
streamlit run dashboard/app.py                           # interactive dashboard
```

The satellite pipeline runs Monte Carlo optimisation at many points along a pass and across four city-pair links, so a full run without plots takes a few minutes. The dashboard shows pass geometry, atmosphere, turbulence, key rate with real losses, annual availability, multi-city links and a final per-link table in one place.

## What is not finished

I would rather list the gaps than hide them.

1. The background-suppression factor was derived for the Delhi to Mumbai link and is reused for the other pairs. It should be derived again for each one.
2. Only Delhi to Mumbai has a full annual model. The other city pairs need the same seasonal and weather analysis.
3. The tests are plain-text smoke tests. They should become a `pytest` suite.
4. The Gamma-Gamma table is slow because it runs global optimisation at every distance and turbulence case. Vectorising that loop would help.

## Where to go next

The code and the figures from each stage are in the [QSAFire folder on GitHub](https://github.com/Anand-Ambastha/QSAFIRE/tree/main/qsafire). The internship report is in the root of the [same repository](https://github.com/Anand-Ambastha/QSAFIRE). The [Research page](../research/) describes the wider work at the Scientific Analysis Group. If you work on satellite quantum links and want to compare notes, [get in touch](../contact/).
