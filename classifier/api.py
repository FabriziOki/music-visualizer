from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from classifier.mood_classifier import classify_mood
from audio.extractor import extract_features

app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/classify")
def classify(path: str):
    try:
        features = extract_features(path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Audio file not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    mood = classify_mood(features)
    return {"mood": mood, "features": features}

@app.get("/mock")
def mock(mood: str = "euphoric"):
    return {"mood": mood}