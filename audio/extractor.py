import numpy as np
import librosa


def load_audio(path: str) -> tuple[np.ndarray, int]:
    return librosa.load(path, sr=None)


def get_bpm(y: np.ndarray, sr: int) -> float:
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    raw = float(np.atleast_1d(tempo)[0])
    # librosa sometimes detects double-time on slow/complex songs; fold back above 165
    return raw / 2 if raw > 165 else raw


def get_energy(y: np.ndarray) -> float:
    rms = librosa.feature.rms(y=y)
    return float(np.clip(np.mean(rms), 0.0, 1.0))


def get_valence(y: np.ndarray, sr: int) -> float:
    # Spectral centroid as a brightness proxy, normalized against Nyquist
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
    return float(np.clip(np.mean(centroid) / (sr / 2), 0.0, 1.0))


def get_danceability(y: np.ndarray, sr: int) -> float:
    # Beat regularity: high mean relative to std = strong consistent beats
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    mean = np.mean(onset_env)
    std = np.std(onset_env)
    return float(np.clip(mean / (mean + std + 1e-6), 0.0, 1.0))


def get_spectral_centroid(y: np.ndarray, sr: int) -> float:
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
    return float(np.mean(centroid))


def get_zero_crossing_rate(y: np.ndarray) -> float:
    zcr = librosa.feature.zero_crossing_rate(y)
    return float(np.mean(zcr))


# Krumhansl-Schmuckler tonal hierarchy profiles
_MAJOR = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09,
                   2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
_MINOR = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53,
                   2.54, 4.75, 3.98, 2.69, 3.34, 3.17])


def get_mode(y: np.ndarray, sr: int) -> int:
    """Return 1 for major key, 0 for minor key."""
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    vec = np.mean(chroma, axis=1)
    vec = vec / (vec.sum() + 1e-8)

    best_major = max(np.corrcoef(np.roll(vec, -i), _MAJOR)[0, 1] for i in range(12))
    best_minor = max(np.corrcoef(np.roll(vec, -i), _MINOR)[0, 1] for i in range(12))
    return 1 if best_major >= best_minor else 0


def extract_features(path: str) -> dict:
    y, sr = load_audio(path)
    return {
        "bpm":                get_bpm(y, sr),
        "energy":             get_energy(y),
        "valence":            get_valence(y, sr),
        "danceability":       get_danceability(y, sr),
        "spectral_centroid":  get_spectral_centroid(y, sr),
        "zero_crossing_rate": get_zero_crossing_rate(y),
        "mode":               get_mode(y, sr),   # 1 = major, 0 = minor
    }
