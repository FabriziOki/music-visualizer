"""
Run this from the project root:
    python -m classifier.audit_songs

Shows expected vs actual mood for every song, plus which features
are the deciding factors.
"""

from classifier.mood_classifier import classify_mood

songs = [
    {
        "name": "nine blades",
        "expected": "tense",
        "features": {"bpm": 120.18, "energy": 0.142, "valence": 0.065, "danceability": 0.560,
                     "spectral_centroid": 1436.5, "zero_crossing_rate": 0.033, "mode": 0},
    },
    {
        "name": "endless nine",
        "expected": "tense",
        "features": {"bpm": 156.60, "energy": 0.176, "valence": 0.105, "danceability": 0.631,
                     "spectral_centroid": 2326.8, "zero_crossing_rate": 0.051, "mode": 0},
    },
    {
        "name": "silence teto",
        "expected": "aggressive",
        "features": {"bpm": 172.26, "energy": 0.278, "valence": 0.134, "danceability": 0.632,
                     "spectral_centroid": 2960.9, "zero_crossing_rate": 0.068, "mode": 0},
    },
    {
        "name": "last line",
        "expected": "tense",
        "features": {"bpm": 132.51, "energy": 0.242, "valence": 0.069, "danceability": 0.599,
                     "spectral_centroid": 1536.5, "zero_crossing_rate": 0.027, "mode": 0},
    },
    {
        "name": "psychorus",
        "expected": "calm",
        "features": {"bpm": 139.67, "energy": 0.224, "valence": 0.078, "danceability": 0.470,
                     "spectral_centroid": 1739.6, "zero_crossing_rate": 0.047, "mode": 0},
    },
    {
        "name": "realt y",
        "expected": "aggressive",
        "features": {"bpm": 117.45, "energy": 0.324, "valence": 0.134, "danceability": 0.485,
                     "spectral_centroid": 2967.1, "zero_crossing_rate": 0.061, "mode": 0},
    },
    {
        "name": "telephone miku",
        "expected": "euphoric",
        "features": {"bpm": 84.72, "energy": 0.269, "valence": 0.145, "danceability": 0.538,
                     "spectral_centroid": 3213.3, "zero_crossing_rate": 0.069, "mode": 1},
    },
    {
        "name": "never meant to belong",
        "expected": "melancholic",
        "features": {"bpm": 67.99, "energy": 0.088, "valence": 0.058, "danceability": 0.553,
                     "spectral_centroid": 1279.1, "zero_crossing_rate": 0.037, "mode": 0},
    },
    {
        "name": "butter building",
        "expected": "euphoric",
        "features": {"bpm": 160.71, "energy": 0.140, "valence": 0.060, "danceability": 0.395,
                     "spectral_centroid": 1445.5, "zero_crossing_rate": 0.033, "mode": 1},
    },
    {
        "name": "samba",
        "expected":"euphoric",
        "features":{"bpm":127.8409090909091,"energy":0.2178761065006256,"valence":0.14900022321560608,"danceability":0.491023451089859,"spectral_centroid":3576.005357174546,"zero_crossing_rate":0.06654143507463219,"mode":1}
    },
]

# ── run ──────────────────────────────────────────────────────────────────────

passed = 0
failed = 0

print(f"\n{'song':<25} {'expected':<12} {'got':<12} {'result'}")
print("─" * 65)

for s in songs:
    got    = classify_mood(s["features"])
    ok     = got == s["expected"]
    passed += ok
    failed += not ok
    mark   = "✓" if ok else "✗"
    print(f"{s['name']:<25} {s['expected']:<12} {got:<12} {mark}")

print("─" * 65)
print(f"\n{passed}/{len(songs)} correct\n")

# ── detail for failures ───────────────────────────────────────────────────────

failures = [s for s in songs if classify_mood(s["features"]) != s["expected"]]
if failures:
    print("Detail on failures:")
    for s in failures:
        print(f"\n  {s['name']} (expected {s['expected']}, got {classify_mood(s['features'])})")
        for k, v in s["features"].items():
            print(f"    {k:<22} {v}")