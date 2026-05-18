def classify_mood(features: dict) -> str:
    bpm               = features["bpm"]
    energy            = features["energy"]
    zcr               = features["zero_crossing_rate"]
    spectral_centroid = features["spectral_centroid"]

    # aggressive: fast or loud+noisy, dark timbre
    if bpm >= 150 or (energy >= 0.25 and zcr >= 0.06):
        return "aggressive"

    # euphoric: bright timbre + noisy + decent energy
    if spectral_centroid >= 2800 and zcr >= 0.06 and energy >= 0.2:
        return "euphoric"

    # melancholic: slow and quiet
    if bpm < 90 and energy < 0.15:
        return "melancholic"

    # tense: mid bpm, low zcr, dark (low spectral centroid)
    if bpm >= 120 and spectral_centroid < 2000 and zcr < 0.05:
        return "tense"

    # calm: low zcr, low-mid energy, not fast
    if zcr < 0.05 and energy < 0.25 and bpm < 150:
        return "calm"

    # tense: everything else — mid bpm, mid energy, not clean enough to be calm
    return "tense"