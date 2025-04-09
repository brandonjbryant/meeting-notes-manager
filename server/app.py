#app.py: Main API logic.
from fastapi import FastAPI, HTTPException, File, UploadFile, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from PyPDF2 import PdfReader
from docx import Document
import requests  # Replacing openai with requests
from transformers import pipeline
import os
import http.client  # Replacing requests for audio upload
from collections import Counter


# Set your OpenAI API key
OPENAI_API_KEY = "your_openai_api_key"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to restrict origins if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base = declarative_base()

# Define the MeetingNotes table
class MeetingNotes(Base):
    __tablename__ = "meeting_notes"
    id = Column(Integer, primary_key=True, index=True)
    attendees = Column(Text)
    discussion_points = Column(Text)
    additional_context = Column(Text)
    transcript = Column(Text)
    notes = Column(Text)

# Define the MeetingAgenda table
class MeetingAgenda(Base):
    __tablename__ = "meeting_agendas"
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer)
    agenda_items = Column(Text)
    follow_up_tasks = Column(Text)

# Create the SQLite database
DATABASE_URL = "sqlite:///./meeting_notes.db"
engine = create_engine(DATABASE_URL)
Base.metadata.create_all(bind=engine)

# Create a session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

print(f"Database file path: {os.path.abspath('meeting_notes.db')}")

class MeetingNoteRequest(BaseModel):
    attendees: List[str]
    discussion_points: List[str]
    additional_context: str
    transcript: Optional[str] = None  # New field for transcript
    attachments: Optional[List[str]] = None  # New field for attachments
    summarize_transcript: Optional[bool] = True  # New field

# Load the summarization pipeline
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

@app.post("/generate-notes/")
async def generate_notes(request: MeetingNoteRequest):
    # Placeholder implementation
    return {"message": "Notes generation logic is not yet implemented"}

@app.post("/upload-file/")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Read the file content based on its type
        if file.filename.endswith(".txt") or file.filename.endswith(".md"):
            content = (await file.read()).decode("utf-8")  # Read as plain text
        elif file.filename.endswith(".pdf"):
            pdf_reader = PdfReader(file.file)
            content = "\n".join([page.extract_text() for page in pdf_reader.pages])
        elif file.filename.endswith(".docx"):
            doc = Document(file.file)
            content = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")

        # Summarize after 500 words
        words = content.split()
        if len(words) > 500:
            content = " ".join(words[:500]) + "...\n\n[Transcript truncated after 500 words]"

        return {"transcript": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/ask-question/")
async def ask_question(question: str, note_id: int):
    db = SessionLocal()
    note = db.query(MeetingNotes).filter(MeetingNotes.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    # Use OpenAI API directly with requests
    prompt = f"""
    Based on the following meeting notes, answer the question:
    Meeting Notes: {note.notes}
    Question: {question}
    """
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    data = {
        "model": "text-davinci-003",
        "prompt": prompt,
        "max_tokens": 150,
    }
    response = requests.post("https://api.openai.com/v1/completions", headers=headers, json=data)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json())

    answer = response.json()["choices"][0]["text"].strip()
    return {"answer": answer}

@app.post("/extract-action-items/")
async def extract_action_items(note_id: int):
    db = SessionLocal()
    note = db.query(MeetingNotes).filter(MeetingNotes.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    prompt = f"""
    Extract action items and key decisions from the following meeting notes:
    {note.notes}
    """
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    data = {
        "model": "text-davinci-003",
        "prompt": prompt,
        "max_tokens": 200,
    }
    response = requests.post("https://api.openai.com/v1/completions", headers=headers, json=data)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json())

    action_items = response.json()["choices"][0]["text"].strip()
    return {"action_items": action_items}

@app.post("/create-agenda/")
async def create_agenda(meeting_id: int, agenda_items: List[str]):
    db = SessionLocal()
    agenda = MeetingAgenda(
        meeting_id=meeting_id,
        agenda_items=", ".join(agenda_items),
    )
    db.add(agenda)
    db.commit()
    return {"message": "Agenda created successfully"}

@app.post("/upload-audio/")
async def upload_audio(file: UploadFile = File(...)):
    # Replace requests with http.client for audio upload
    conn = http.client.HTTPSConnection("api.assemblyai.com")
    headers = {"authorization": "your_api_key"}
    audio_data = await file.read()
    conn.request("POST", "/v2/transcript", body=audio_data, headers=headers)
    response = conn.getresponse()
    data = response.read()
    conn.close()
    return {"transcript": data.decode("utf-8")}

@app.get("/analytics/")
async def get_analytics():
    db = SessionLocal()
    notes = db.query(MeetingNotes).all()
    topics = [point for note in notes for point in note.discussion_points.split(",")]
    topic_counts = Counter(topics)
    return {"topic_counts": topic_counts}

@app.get("/notes/{note_id}")
async def get_note(note_id: int):
    db = SessionLocal()
    note = db.query(MeetingNotes).filter(MeetingNotes.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

active_connections = {}

@app.websocket("/ws/notes/{note_id}")
async def websocket_endpoint(websocket: WebSocket, note_id: int):
    await websocket.accept()
    if note_id not in active_connections:
        active_connections[note_id] = []
    active_connections[note_id].append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            for connection in active_connections[note_id]:
                await connection.send_text(data)
    except WebSocketDisconnect:
        active_connections[note_id].remove(websocket)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8080)