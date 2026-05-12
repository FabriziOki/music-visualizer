# 🎵 Music Mood Detector + Visualizer

A multimedia pipeline that analyzes an audio file, detects its emotional mood, and drives a real-time visual experience based on the result.

---

## Overview

The system takes a music file as input, extracts audio features, classifies the mood, and maps it to colors and animations in an interactive visualizer.

```
Audio File → [B: Feature Extraction] → [C: Mood Classifier + API] → [A: Visualizer]
```

---

## Team Split

| Person | Responsibility | Stack |
|--------|---------------|-------|
| **A** | Frontend visualizer — canvas animations, mood-to-color/shape mapping, creative direction | p5.js |
| **B** | Audio engine — loads audio files, runs FFT and feature extraction, outputs feature dict | `librosa`, `numpy`, `sounddevice` |
| **C** | Classifier + integration — maps features to mood label, serves results via API | `FastAPI`, `scikit-learn` (optional) |

---

## Feature Dictionary (Shared Contract)

This is the schema B outputs and C consumes. **Do not change field names without notifying the team.**

```python
{
  "bpm": 120.0,                 # Tempo in beats per minute
  "energy": 0.75,               # RMS loudness, normalized 0–1
  "valence": 0.6,               # Spectral brightness proxy (high = brighter/happier)
  "danceability": 0.8,          # Beat regularity and strength
  "spectral_centroid": 3200.0,  # Timbral sharpness in Hz
  "zero_crossing_rate": 0.05    # Signal noisiness (helps separate calm vs chaotic)
}
```

> **Note:** Mood labels (`"euphoric"`, `"calm"`, `"aggresive"`, `"melancholic"`, `"tense"`) are defined by Person C and communicated to Person A for visual mapping.

---

## Getting Started

> Each member can work independently once the feature dictionary above is agreed upon. Use hardcoded mock values of the schema to develop and test your component before integration.

```
# B: output a real feature dict from a test audio file
# C: accept a hardcoded dict, return a mock mood label via the API
# A: render visuals from a hardcoded mood label string
```

---

## Project Structure (Proposed)

```
music-mood-visualizer/
├── audio/          # B — feature extraction module
├── classifier/     # C — mood rules + FastAPI server
├── visualizer/     # A — p5.js frontend
└── README.md
```
