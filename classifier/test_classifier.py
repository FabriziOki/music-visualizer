from classifier.mood_classifier import classify_mood

# Fixtures include `mode` (1=major, 0=minor) and realistic feature ranges.
euphoric    = {"bpm": 120, "energy": 0.35, "valence": 0.75, "danceability": 0.80,
               "spectral_centroid": 3500, "zero_crossing_rate": 0.05, "mode": 1}

calm        = {"bpm": 72,  "energy": 0.10, "valence": 0.65, "danceability": 0.30,
               "spectral_centroid": 2000, "zero_crossing_rate": 0.02, "mode": 1}

aggressive  = {"bpm": 150, "energy": 0.45, "valence": 0.25, "danceability": 0.50,
               "spectral_centroid": 3000, "zero_crossing_rate": 0.05, "mode": 0}

melancholic = {"bpm": 68,  "energy": 0.07, "valence": 0.22, "danceability": 0.25,
               "spectral_centroid": 1400, "zero_crossing_rate": 0.02, "mode": 0}

tense       = {"bpm": 115, "energy": 0.35, "valence": 0.30, "danceability": 0.35,
               "spectral_centroid": 1800, "zero_crossing_rate": 0.05, "mode": 0}


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
