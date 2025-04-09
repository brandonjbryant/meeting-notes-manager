import React, { useState, useEffect } from "react";
import axios from "axios";
import NotesList from "./components/NotesList";
import AddNoteForm from "./components/AddNoteForm";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [notes, setNotes] = useState([]);

  // Fetch notes from the backend
  useEffect(() => {
    axios.get(`${API_URL}/notes`)
      .then((response) => setNotes(response.data))
      .catch((error) => console.error("Error fetching notes:", error));
  }, []);

  // Add a new note
  const addNote = (note) => {
    axios.post(`${API_URL}/notes`, note)
      .then((response) => setNotes([...notes, response.data]))
      .catch((error) => console.error("Error adding note:", error));
  };

  // Delete a note
  const deleteNote = (id) => {
    axios.delete(`${API_URL}/notes/${id}`)
      .then(() => setNotes(notes.filter((note) => note.id !== id)))
      .catch((error) => console.error("Error deleting note:", error));
  };

  return (
    <div className="App">
      <h1>Meeting Notes Manager</h1>
      <AddNoteForm addNote={addNote} />
      <NotesList notes={notes} deleteNote={deleteNote} />
    </div>
  );
}

export default App;