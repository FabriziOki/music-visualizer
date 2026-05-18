from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mood_classifier import classify_mood

app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.post("/classify")
def classify(features: dict):
    mood = classify_mood(features)
    return {"mood": mood}

@app.get("/mock")
def mock(mood: str = "euphoric"):
    return {"mood": mood}