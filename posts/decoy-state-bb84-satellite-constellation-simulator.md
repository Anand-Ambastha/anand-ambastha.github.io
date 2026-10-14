---
title: Simulating a decoy-state BB84 satellite constellation over India
date: 2026-10-15
tags: [bb84, satellite-qkd, constellation, simulation]
summary: How the simulator behind my Springer paper works, from Walker-Delta orbits to the key a station collects in a day, and what its numbers do and do not say.
---

How much quantum-secure key could a small satellite constellation deliver to ground stations in India in one day? That question is behind my first-author paper in the *International Journal of Information Technology* (Springer, 2025), and this post describes the simulator I wrote to answer it. The project entry is on the [Projects page](../projects/), and the code is on [GitHub](https://github.com/Anand-Ambastha/qkd-satellite-constellation).

## What it simulates

The simulator follows a Walker-Delta constellation of low-Earth-orbit satellites for 24 hours. For each satellite and ground station it finds when the satellite is visible, estimates the optical link loss, and computes the secret key rate and error rate of the decoy-state BB84 protocol. The output is a set of per-station CSV files, nine kinds of figure, and a dashboard for exploring the parameters.

The default case has 3 orbital planes with 4 satellites each, at 600 km altitude and 97.5 degrees inclination, stepped every 5 minutes.

## The pieces

**Constellation.** A Walker-Delta generator builds the constellation from the usual T/P/F description and can export synthetic TLEs. The propagator is written in plain Python with no orbital library. It solves Kepler's equation by Newton-Raphson and adds the J2 secular drift of the orbit plane:

$$
\dot{\Omega} = -\tfrac{3}{2}\, J_2 \left(\frac{R_e}{p}\right)^2 n \cos i
$$

Positions go through the chain from orbital elements to ECI, then ECEF, then a local topocentric frame at the station. The chosen inclination is close to the sun-synchronous condition, so the orbit planes keep a steady angle to the Sun.

**Ground stations.** Five sites across India, a mix of observatory and research locations:

| Station | Latitude (°N) | Longitude (°E) | Altitude (m) |
| --- | --- | --- | --- |
| Hanle | 32.78 | 78.96 | 4500 |
| Dehradun | 30.30 | 78.00 | 640 |
| Mt Abu | 24.60 | 72.70 | 1220 |
| Shillong | 25.60 | 91.80 | 1500 |
| Kodaikanal | 10.20 | 77.40 | 2343 |

**Optical channel.** The model collects light with a receiver aperture $D_{rx}$ from a beam with divergence $\theta_{div}$ at slant range $r$, and applies atmospheric transmittance that falls as the satellite gets lower in the sky:

$$
\eta_{geo} = \left(\frac{D_{rx}}{\theta_{div}\, r}\right)^2, \qquad T_{atm} = \exp\!\left(-\frac{\tau_{zenith}}{\sin(\text{elevation})}\right)
$$

The defaults are a 0.5 m aperture and a 10 microradian divergence. A pass counts as usable only while the link loss stays below a threshold, 60 dB by default.

**Protocol.** The asymptotic decoy-state BB84 key rate is

$$
R \approx q_\mu \left[\, 1 - f_{EC}\, H(e_\mu) \,\right]
$$

where $q_\mu$ is the gain, $f_{EC} = 1.16$ is the error-correction efficiency and $H$ is the binary entropy. The error rate $e_\mu$ is modelled as rising linearly with link loss from a 2 percent floor.

## What the default run says

For the default constellation over 24 hours, the best station and the worst station are not far apart.

| Station | Coverage (share of the day) | Highest elevation reached |
| --- | --- | --- |
| Hanle | 1.7% | 58.7° |
| Dehradun | 1.6% | 40.9° |
| Kodaikanal | 1.4% | 34.8° |
| Shillong | 1.3% | 74.2° |
| Mt Abu | 1.3% | 84.3° |

Hanle collects the most key and Kodaikanal the least, but the differences are small. The larger point is that coverage stays below 2 percent of the day for every station. Twelve satellites in low orbit pass over a given site briefly and rarely. Larger constellations, different altitudes and more stations are changes you can try from the command line.

## Running it

```bash
git clone https://github.com/Anand-Ambastha/qkd-satellite-constellation
cd qkd-satellite-constellation
pip install -r requirements.txt

python cli/simulate.py                       # full 24 h run
streamlit run dashboard/app.py               # interactive dashboard
python cli/simulate.py --planes 3 --sats-per-plane 3 --altitude 550 \
                       --inclination 98 --duration 720 --step 2
```

Every parameter can also be set in a YAML file and loaded with `--config`.

## Testing

The repository has unit tests for the orbit mechanics, the constellation generator and the QKD channel and protocol, plus one integration test that runs a whole simulation. In the README, 28 of 29 tests pass. The remaining test, a check of the RAAN position, is skipped on purpose, because J2 precession moves the perigee over one orbit, so the radius is preserved and the position is not.

## Limits to keep in mind

This is a feasibility model, and I would not read its key numbers as predictions for hardware.

- The error rate is a simple function of link loss, not derived from detector noise, background light or pointing errors.
- Weather is not part of the model, so availability depends only on geometry and link loss.
- The atmosphere is a single transmittance law, without the turbulence and pointing layers I added later in [QSAFire](../post/#qsafire-satellite-sns-tf-qkd-simulator).

The code is released for viewing and learning. Reuse needs permission, which you can ask for through the [contact page](../contact/). The paper is on the [Publications page](../publications/).
