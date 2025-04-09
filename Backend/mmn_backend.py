from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

# Initialize the FastAPI app
# This creates an instance of the FastAPI application, which will handle incoming HTTP requests.
app = FastAPI()

# In-memory storage for meeting notes
# This list will act as a temporary database to store meeting notes during the runtime of the application.
notes = []

# Define the data model for a meeting note
# The Note class defines the structure of a meeting note using Pydantic.
# Each note will have an ID, a title, and content.
class Note(BaseModel):
    id: int       # Unique identifier for the note
    title: str    # Title of the meeting note
    content: str  # Content or description of the meeting note

@app.get("/")
def read_root():
    """
    Root endpoint to check if the API is running.
    This endpoint returns a simple message to confirm that the API is operational.
    """
    return {"message": "Meeting Notes Manager API is running"}

@app.get("/notes", response_model=List[Note])
def get_notes():
    """
    Endpoint to retrieve all meeting notes.
    This returns the list of all notes stored in the in-memory database.
    """
    return notes

@app.post("/notes", response_model=Note)
def create_note(note: Note):
    """
    Endpoint to create a new meeting note.
    - Accepts a JSON object with `id`, `title`, and `content`.
    - Adds the new note to the in-memory list.
    - Returns the created note as a response.
    """
    notes.append(note)  # Add the new note to the list
    return note         # Return the created note

@app.delete("/notes/{note_id}")
def delete_note(note_id: int):
    """
    Endpoint to delete a meeting note by its ID.
    - Accepts the `note_id` as a path parameter.
    - Removes the note with the matching ID from the in-memory list.
    - Returns a confirmation message.
    """
    global notes
    # Filter out the note with the specified ID
    notes = [note for note in notes if note.id != note_id]
    return {"message": f"Note with ID {note_id} deleted"}