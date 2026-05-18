import numpy as np
import librosa


def load_audio(path: str) -> tuple[np.ndarray, int]:
    return librosa.load(path, sr=None)


def get_bpm(y: np.ndarray, sr: int) -> float:
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    return float(np.atleast_1d(tempo)[0])


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


def extract_features(path: str) -> dict:
    y, sr = load_audio(path)
    return {
        "bpm": get_bpm(y, sr),
        "energy": get_energy(y),
        "valence": get_valence(y, sr),
        "danceability": get_danceability(y, sr),
        "spectral_centroid": get_spectral_centroid(y, sr),
        "zero_crossing_rate": get_zero_crossing_rate(y),
    }
