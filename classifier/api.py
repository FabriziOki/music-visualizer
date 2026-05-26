import os
import tempfile
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from classifier.mood_classifier import classify_mood
from audio.extractor import extract_features

app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.post("/classify")
async def classify(file: UploadFile = File(...)):
    # save the uploaded file to a temp location
    suffix = os.path.splitext(file.filename)[1]  # keeps .mp3 or .wav
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    # process and delete regardless of what happens
    try:
        features = extract_features(tmp_path)
        mood = classify_mood(features)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        os.remove(tmp_path)  # always delete the temp file

    return {"mood": mood, "features": features}


@app.get("/mock")
def mock(mood: str = "euphoric"):
    return {"mood": mood}


app.mount("/", StaticFiles(directory="visualizer", html=True), name="static")