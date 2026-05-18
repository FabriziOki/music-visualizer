def classify_mood(features: dict) -> str:
    bpm        = features["bpm"]
    energy     = features["energy"]
    valence    = features["valence"]
    danceability = features["danceability"]
    zcr        = features["zero_crossing_rate"]

    if bpm >= 120 and energy >= 0.7 and valence >= 0.6 and danceability >= 0.65:
        return "euphoric"

    if energy >= 0.7 and (valence < 0.4 or zcr >= 0.07):
        return "aggressive"

    if energy < 0.4 and valence >= 0.5:
        return "calm"

    if energy < 0.5 and valence < 0.4:
        return "melancholic"

    return "tense"