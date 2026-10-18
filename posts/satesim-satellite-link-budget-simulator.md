---
title: SateSim, a satellite link budget simulator with a dashboard
date: 2026-10-15
category: project
tags: [satesim, link-budget, satellite, python]
summary: How SateSim turns an orbit and a ground station into SNR, BER, Doppler shift and elevation, with a dashboard, CSV export and a PDF report.
---

SateSim answers a basic question in satellite communication. For a satellite passing over a ground station, how good is the radio link at every moment? It combines orbit propagation, an RF link budget and a dashboard, and it produces SNR, bit error rate, Doppler shift and elevation angle for each pass. This post explains how it is organised and what it leaves out. The entry on the [Projects page](../projects/) has the short version, and the code is on [GitHub](https://github.com/Anand-Ambastha/SateSim).

## From an orbit to a link budget

The pipeline has three steps, and each one feeds the next.

1. **Where is the satellite?** SGP4, run through Skyfield, propagates the orbit and gives the satellite's position and velocity relative to the ground station at each time step.
2. **How strong is the signal?** The range and elevation from step one go into a link budget. Free-space path loss and the Friis transmission equation turn distance and frequency into received power, and the received power gives the signal-to-noise ratio.
3. **How good is the link?** The SNR is mapped to a bit error rate for BPSK or QPSK modulation.

Doppler shift comes from the same geometry. It is the projection of the satellite's relative velocity onto the line of sight, scaled by the carrier frequency. Satellites below a minimum elevation angle are dropped, because a link close to the horizon is not usable.

For reference, the two standard relations behind the budget are:

$$
\mathrm{FSPL(dB)} = 20\log_{10}(d_{\mathrm{km}}) + 20\log_{10}(f_{\mathrm{MHz}}) + 32.44
$$

$$
P_r = P_t\, G_t\, G_r \left(\frac{\lambda}{4\pi d}\right)^2
$$

Path loss grows with both distance and frequency, so a satellite at low elevation, far away, always has the weakest link of the pass.

## How the code is split

SateSim keeps the physics apart from the interface, which makes each part easy to test and reuse.

| File | Role |
| --- | --- |
| `core.py` | Physics and communication models, with vectorised multi-satellite propagation and no UI code |
| `app.py` | Streamlit dashboard with Plotly maps and time series, session state and exports |
| `report.py` | Matplotlib figures and a multi-page PDF report built with ReportLab |
| `run_simulation.py` | Command-line interface for headless, parameterised runs |

The dashboard and the command line share the same `core.py`, so a result from one can be reproduced with the other.

## Running it

```bash
pip install -r requirements.txt

streamlit run app.py                                              # interactive dashboard
python run_simulation.py --duration 90 --modulation BPSK --freq 2.0   # headless run
```

A run produces an interactive dashboard, CSV datasets for analysis, high-resolution PNG plots and a structured technical PDF report that includes the equations, the plots and a short analysis.

## Where it came from

SateSim is my own implementation of ideas from the satellite communication lectures by Prof. A. Al-Hourani of RMIT University. I wrote it to learn the material by building it, and it is not affiliated with or endorsed by RMIT or Prof. Al-Hourani. That origin also explains its scope: it is a clear, working model of the basics and not a mission-grade tool.

## What it does not model yet

- Rain attenuation and other atmospheric loss
- Modulation schemes beyond BPSK and QPSK
- Live TLE data
- Performance work for very large constellations

The atmospheric part is the one I care about most. It is the bridge to my work on optical satellite links, where turbulence, absorption and weather decide the key rate, as in [QSAFire](../post/#qsafire-satellite-sns-tf-qkd-simulator).

## Try it

The code, the dashboard screenshots and the README are in the [SateSim repository](https://github.com/Anand-Ambastha/SateSim) under an MIT license. If you have a use for a small link-budget tool, or ideas for the missing pieces, [get in touch](../contact/).
