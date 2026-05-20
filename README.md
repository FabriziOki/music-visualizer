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
| **Violeta** | Frontend visualizer — canvas animations, mood-to-color/shape mapping, creative direction | p5.js |
| **Fabrizio** | Audio engine — loads audio files, runs FFT and feature extraction, outputs feature dict | `librosa`, `numpy`, `sounddevice` |
| **Carlos** | Classifier + integration — maps features to mood label, serves results via API | `FastAPI`, `scikit-learn` (optional) |

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

> **Note:** Mood labels (`"euphoric"`, `"calm"`, `"aggressive"`, `"melancholic"`, `"tense"`) are defined by Person C and communicated to Person A for visual mapping.

---

## Getting Started

> Each member can work independently once the feature dictionary above is agreed upon. Use hardcoded mock values of the schema to develop and test your component before integration.

```
# B: output a real feature dict from a test audio file
# C: accept a hardcoded dict, return a mock mood label via the API
# A: render visuals from a hardcoded mood label string
```

---

## Integration Guide

### Person C — Using the Audio Module

**Option 1: Direct Python import (recommended)**

Install the package from the repo root, then import:

```bash
uv sync
```

```python
from audio import extract_features

features = extract_features("path/to/song.mp3")
# features is a plain dict — pass it straight into your classifier
mood = classify(features)
```

Call `extract_features` inside your FastAPI route handler, passing whatever file path the user uploaded.

**Option 2: Subprocess (if environments are separate)**

```python
import subprocess, json

result = subprocess.run(
    ["python", "-m", "audio", "path/to/song.mp3"],
    capture_output=True, text=True, check=True
)
features = json.loads(result.stdout)
```

**Expected value ranges**

| Field | Type | Range | Notes |
|-------|------|-------|-------|
| `bpm` | float | ~40–220 | Beats per minute, not normalized |
| `energy` | float | 0–1 | RMS loudness; quiet tracks < 0.1, loud > 0.5 |
| `valence` | float | 0–1 | Brightness proxy; bright/happy → high |
| `danceability` | float | 0–1 | Beat consistency; chaotic → low |
| `spectral_centroid` | float | ~500–8000 Hz | Raw Hz, not normalized |
| `zero_crossing_rate` | float | ~0.01–0.15 | Higher = noisier/more chaotic |

**Error handling**

`extract_features` raises `FileNotFoundError` if the path doesn't exist, and a generic `Exception` for unsupported formats. Wrap it in a try/except in your route and return an appropriate HTTP error.

---

### Person A — Using the Mood Label

Person A does **not** interact with the audio module at all. The only output A consumes is the mood label string from C's API endpoint. No audio processing happens on the frontend.

Mood labels C will return (for A to map visually):

| Label | Description |
|-------|-------------|
| `"euphoric"` | High energy, high valence |
| `"calm"` | Low energy, low zero crossing rate |
| `"aggressive"` | High energy, low valence, high BPM |
| `"melancholic"` | Low energy, low valence |
| `"tense"` | High zero crossing rate, mid energy |

---

## Project Structure (Proposed)

```
music-mood-visualizer/
├── audio/          # B — feature extraction module
├── classifier/     # C — mood rules + FastAPI server
├── visualizer/     # A — p5.js frontend
└── README.md
```
