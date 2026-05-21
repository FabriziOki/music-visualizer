# Music Mood Visualizer

A multimedia pipeline that analyzes an uploaded audio file, classifies its emotional mood using extracted acoustic features, and drives a real-time browser-based visualization synchronized to the music.

---

## Overview

The system accepts a music file from the browser, sends it to a Python backend that extracts audio features and classifies the mood, and maps the result to a distinct color palette and animation style rendered on an HTML5 canvas using p5.js. Audio playback with full transport controls (play/pause, seek, volume) runs in parallel in the browser.

```
User uploads audio file
        │
        ▼
[FastAPI Backend]
   ├── Audio Engine  → Feature Extraction (librosa)
   └── Classifier    → Mood Label (rule-based)
        │
        ▼
[Browser Frontend]
   ├── p5.js Canvas  → Real-time frequency bar visualization
   └── Web Audio API → Playback with transport controls
```

---

## Team

| Member | Responsibility | Technologies |
|--------|---------------|--------------|
| **Violeta** | Frontend visualizer — canvas animations, mood-to-color mapping, audio player UI | p5.js, Web Audio API, HTML/CSS |
| **Fabrizio** | Audio engine — loads audio files, runs FFT and feature extraction | `librosa`, `numpy` |
| **Carlos** | Classifier + API — rule-based mood classification, REST endpoint | `FastAPI`, `uvicorn` |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend language | Python 3.10+ |
| Dependency management | `uv` + `pyproject.toml` |
| Audio analysis | `librosa`, `numpy` |
| API server | `FastAPI`, `uvicorn` |
| Frontend rendering | p5.js (via CDN) |
| Browser audio | Web Audio API (`AudioContext`, `AnalyserNode`) |

---

## Project Structure

```
music-mood-visualizer/
├── audio/
│   ├── __init__.py          # Public API: exports extract_features
│   ├── __main__.py          # CLI runner: python -m audio <file>
│   └── extractor.py         # Feature extraction using librosa
├── classifier/
│   ├── __init__.py
│   ├── mood_classifier.py   # Rule-based mood classification logic
│   ├── api.py               # FastAPI application with /classify endpoint
│   └── test_classifier.py   # Unit tests for all five mood labels
├── visualizer/
│   ├── index.html           # UI: mood labels, file upload, audio player
│   ├── sketch.js            # p5.js canvas + Web Audio API integration
│   └── style.css            # Layout and styling
├── samples/
│   └── Love Takes Miles.mp3 # Sample audio file for testing
├── pyproject.toml           # Project metadata and dependencies
└── README.md
```

---

## Setup and Running

### Prerequisites

- [uv](https://docs.astral.sh/uv/) installed

### Install dependencies

```bash
uv sync
```

### Start the backend

```bash
uv run uvicorn classifier.api:app --reload
```

The API will be available at `http://localhost:8000`.

### Open the frontend

Open `visualizer/index.html` directly in a browser (no build step required). Upload an audio file using the music note icon to begin.

---

## API Reference

### `POST /classify`

Accepts an audio file upload, extracts features, and returns the classified mood.

**Request:** `multipart/form-data` with a field named `file` (`.mp3` or `.wav`).

**Response:**

```json
{
  "mood": "euphoric",
  "features": {
    "bpm": 138.5,
    "energy": 0.61,
    "valence": 0.74,
    "danceability": 0.82,
    "spectral_centroid": 3412.0,
    "zero_crossing_rate": 0.08
  }
}
```

### `GET /mock?mood=<label>`

Returns a mock response without processing any audio. Useful for frontend development.

---

## Extracted Features

| Feature | Type | Range | Description |
|---------|------|-------|-------------|
| `bpm` | float | ~40–220 | Tempo in beats per minute |
| `energy` | float | 0–1 | RMS loudness, normalized |
| `valence` | float | 0–1 | Spectral brightness proxy (higher = brighter/happier) |
| `danceability` | float | 0–1 | Beat regularity; low = chaotic, high = consistent |
| `spectral_centroid` | float | ~500–8000 Hz | Average timbral sharpness in Hz |
| `zero_crossing_rate` | float | ~0.01–0.15 | Signal noisiness; higher = more chaotic |

---

## Mood Classification

Classification is rule-based, using threshold comparisons on the extracted features. Rules are evaluated in priority order:

| Mood | Primary Rules |
|------|---------------|
| `aggressive` | BPM ≥ 150, or energy ≥ 0.25 and ZCR ≥ 0.06 |
| `euphoric` | Spectral centroid ≥ 2800 Hz, ZCR ≥ 0.06, energy ≥ 0.20 |
| `melancholic` | BPM < 90 and energy < 0.15 |
| `tense` | BPM ≥ 120 and spectral centroid < 2000 Hz and ZCR < 0.05 |
| `calm` | ZCR < 0.05, energy < 0.25, BPM < 150 |

If no rule matches, the track defaults to `tense`.

---

## Visualization

Each mood maps to a distinct color and bar-length scale rendered as radial frequency bars on a full-screen canvas. The bars react in real time to the frequency spectrum of the playing audio via the Web Audio API.

| Mood | Color | Bar Length |
|------|-------|-----------|
| `euphoric` | Purple `(128, 0, 128)` | 230 px |
| `calm` | Sea green `(46, 139, 87)` | 180 px |
| `aggressive` | Crimson `(220, 20, 60)` | 300 px |
| `melancholic` | Dodger blue `(30, 144, 255)` | 150 px |
| `tense` | Sandy brown `(244, 164, 96)` | 260 px |

Before a file is loaded, a slow-rotating white idle animation plays.

---

## Running Tests

```bash
uv run pytest classifier/test_classifier.py -v
```

Tests cover all five mood labels with representative feature vectors.
