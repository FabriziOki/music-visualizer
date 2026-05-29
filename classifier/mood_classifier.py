def classify_mood(features: dict) -> str:
    bpm               = features["bpm"]
    energy            = features["energy"]
    zcr               = features["zero_crossing_rate"]
    spectral_centroid = features["spectral_centroid"]
    danceability      = features["danceability"]
    mode              = features["mode"]  # 1 = major, 0 = minor

    # melancholic: minor key, slow, quiet
    if mode == 0 and bpm < 90 and energy < 0.15:
        return "melancholic"

    # euphoric: major key with enough energy (mode is the strongest signal)
    if mode == 1 and energy >= 0.12:
        return "euphoric"

    # aggressive: extremely fast, OR loud with bright noisy timbre
    if bpm >= 165 or (energy >= 0.25 and spectral_centroid >= 2500):
        return "aggressive"

    # tense: minor key, not slow enough to be melancholic
    if mode == 0 and bpm >= 100:
        return "tense"

    # calm: quiet and clean
    if energy < 0.15 and zcr < 0.04:
        return "calm"

    return "tense"
