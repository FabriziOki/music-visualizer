def classify_mood(features: dict) -> str:
    bpm               = features["bpm"]
    energy            = features["energy"]
    zcr               = features["zero_crossing_rate"]
    spectral_centroid = features["spectral_centroid"]
    danceability      = features["danceability"]
    mode              = features["mode"]   # 1 = major, 0 = minor

    # ── melancholic ───────────────────────────────────────────────────────────
    # Dark timbre + very quiet → melancholic regardless of key
    if energy < 0.10 and spectral_centroid < 1600:
        return "melancholic"
    # Very quiet + low danceability + not fast → clearly introspective
    if energy < 0.10 and danceability < 0.40 and bpm < 135:
        return "melancholic"
    # Minor key + slow + not too energetic
    if mode == 0 and bpm < 100 and energy < 0.18:
        return "melancholic"
    # Minor key + extremely quiet (tempo doesn't matter)
    if mode == 0 and energy < 0.12:
        return "melancholic"

    # ── calm ─────────────────────────────────────────────────────────────────
    # Quiet + clean (very low ZCR) — soft, non-noisy music
    if energy < 0.15 and zcr < 0.04:
        return "calm"

    # ── euphoric ─────────────────────────────────────────────────────────────
    # Bright timbre + danceable + enough energy.
    # Intentionally mode-agnostic: upbeat minor-key songs (e.g. rock anthems)
    # should still be euphoric if their acoustic profile says so.
    if spectral_centroid >= 2500 and danceability >= 0.55 and energy >= 0.15:
        return "euphoric"

    # ── aggressive ───────────────────────────────────────────────────────────
    # Fast + some energy, OR loud + very noisy
    if (bpm >= 140 and energy >= 0.15) or (energy >= 0.25 and zcr >= 0.07):
        return "aggressive"

    # ── tense ────────────────────────────────────────────────────────────────
    # Minor key with enough energy to not be melancholic,
    # or dark timbre at a non-slow tempo
    if mode == 0 or (bpm >= 100 and spectral_centroid < 2200):
        return "tense"

    return "calm"
