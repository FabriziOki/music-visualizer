from mood_classifier import classify_mood

euphoric   = {"bpm": 145, "energy": 0.85, "valence": 0.75, "danceability": 0.9,  "spectral_centroid": 3500, "zero_crossing_rate": 0.04}
calm       = {"bpm": 72,  "energy": 0.2,  "valence": 0.65, "danceability": 0.3,  "spectral_centroid": 2000, "zero_crossing_rate": 0.02}
aggressive = {"bpm": 170, "energy": 0.92, "valence": 0.25, "danceability": 0.5,  "spectral_centroid": 4000, "zero_crossing_rate": 0.09}
melancholic= {"bpm": 68,  "energy": 0.28, "valence": 0.22, "danceability": 0.25, "spectral_centroid": 1800, "zero_crossing_rate": 0.03}
tense      = {"bpm": 110, "energy": 0.55, "valence": 0.3,  "danceability": 0.35, "spectral_centroid": 3000, "zero_crossing_rate": 0.05}

def test_euphoric():
    assert classify_mood(euphoric) == "euphoric"

def test_calm():
    assert classify_mood(calm) == "calm"

def test_aggressive():
    assert classify_mood(aggressive) == "aggressive"

def test_melancholic():
    assert classify_mood(melancholic) == "melancholic"

def test_tense():
    assert classify_mood(tense) == "tense"