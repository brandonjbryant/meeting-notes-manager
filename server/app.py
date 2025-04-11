#app.py: Main API logic.
from fastapi import FastAPI, HTTPException, File, UploadFile, WebSocket, WebSocketDisconnect, Depends, Request
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session  # Import Session from sqlalchemy.orm
from transformers import pipeline
import whisper
import os
from collections import Counter
from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi.security import OAuth2PasswordBearer
import openai
import logging

# Load environment variables
load_dotenv()

# Retrieve the OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    raise RuntimeError("OpenAI API key is not set. Please add it to your .env file.")

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Hugging Face API Key (if needed for hosted models)
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Replace with your frontend's URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# Initialize OAuth2 for authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Database setup
Base = declarative_base()
DATABASE_URL = "sqlite:///./meeting_notes.db"  # Replace with PostgreSQL or MySQL in production
engine = create_engine(DATABASE_URL)
Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

logger.info(f"Database file path: {os.path.abspath('meeting_notes.db')}")

# Define database models
class MeetingNotes(Base):
    __tablename__ = "meeting_notes"
    id = Column(Integer, primary_key=True, index=True)
    attendees = Column(Text, nullable=False)
    discussion_points = Column(Text, nullable=False)
    additional_context = Column(Text, nullable=True)
    transcript = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

class MeetingAgenda(Base):
    __tablename__ = "meeting_agendas"
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, nullable=False)
    agenda_items = Column(Text, nullable=False)
    follow_up_tasks = Column(Text, nullable=True)

# Pydantic models for request validation
class MeetingNoteRequest(BaseModel):
    attendees: List[str]
    discussion_points: List[str]
    additional_context: str
    transcript: Optional[str] = None
    attachments: Optional[List[str]] = None
    summarize_transcript: Optional[bool] = True

class AskQuestionRequest(BaseModel):
    question: str
    note_id: int

# Load Hugging Face pipelines
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
question_answerer = pipeline("question-answering", model="distilbert-base-cased-distilled-squad")

# Load Whisper model for audio transcription
whisper_model = whisper.load_model("base")

# Helper function to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/generate-notes/")
async def generate_notes(request_body: MeetingNoteRequest):
    try:
        # Ensure the transcript is provided
        if not request_body.transcript:
            raise HTTPException(status_code=400, detail="Transcript cannot be empty.")

        # Generate notes using OpenAI's GPT model
        response = openai.Completion.create(
            engine="text-davinci-003",  # Use the appropriate GPT model
            prompt=f"Generate meeting notes for the following transcript:\n{request_body.transcript}",
            max_tokens=500,
            temperature=0.7,
        )
        notes = response.choices[0].text.strip()
        return {"notes": notes}
    except Exception as e:
        logger.error(f"Error generating notes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating notes: {str(e)}")

@app.post("/upload-file/")
@limiter.limit("10/minute")  # Increase the limit
async def upload_file(request: Request, file: UploadFile = File(...), token: str = Depends(oauth2_scheme)):
    try:
        if not file:
            raise HTTPException(status_code=400, detail="No file uploaded.")

        # Read the file content based on its type
        if file.filename.endswith(".txt") or file.filename.endswith(".md"):
            content = (await file.read()).decode("utf-8")
        elif file.filename.endswith(".pdf"):
            from PyPDF2 import PdfReader
            pdf_reader = PdfReader(file.file)
            content = "\n".join([page.extract_text() for page in pdf_reader.pages])
        elif file.filename.endswith(".docx"):
            from docx import Document
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
        logger.error(f"Error processing file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/ask-question/")
@limiter.limit("10/minute")  # Increase the limit
async def ask_question(
    request: Request,
    request_body: AskQuestionRequest = Depends(),
    db: Session = Depends(get_db),  # Use Session as the type hint
    token: str = Depends(oauth2_scheme),
):
    note = db.query(MeetingNotes).filter(MeetingNotes.id == request_body.note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if not note.notes:
        raise HTTPException(status_code=400, detail="The note does not contain any content.")

    try:
        result = question_answerer(question=request_body.question, context=note.notes)
        return {"answer": result["answer"]}
    except Exception as e:
        logger.error(f"Error answering question: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error answering question: {str(e)}")

@app.post("/upload-audio/")
@limiter.limit("10/minute")  # Increase the limit
async def upload_audio(request: Request, file: UploadFile = File(...), token: str = Depends(oauth2_scheme)):
    temp_file_path = f"temp_{file.filename}"
    try:
        with open(temp_file_path, "wb") as temp_file:
            temp_file.write(await file.read())

        # Transcribe the audio using Whisper
        result = whisper_model.transcribe(temp_file_path)
        return {"transcript": result["text"]}
    except Exception as e:
        logger.error(f"Error transcribing audio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error transcribing audio: {str(e)}")
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.get("/analytics/")
@limiter.limit("10/minute")  # Increase the limit
async def get_analytics(
    request: Request,
    db: Session = Depends(get_db),  # Use Session as the type hint
    token: str = Depends(oauth2_scheme),
):
    notes = db.query(MeetingNotes).all()
    topics = [point for note in notes for point in note.discussion_points.split(",")]
    topic_counts = Counter(topics)
    return {"topic_counts": topic_counts}

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
        if not active_connections[note_id]:
            del active_connections[note_id]

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8080)