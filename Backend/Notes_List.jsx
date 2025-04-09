import React from "react";

function NotesList({ notes, deleteNote }) {
  return (
    <div>
      <h2>All Notes</h2>
      {notes.length > 0 ? (
        notes.map((note) => (
          <div key={note.id} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
            <h3>{note.title}</h3>
            <p>{note.content}</p>
            <button onClick={() => deleteNote(note.id)}>Delete</button>
          </div>
        ))
      ) : (
        <p>No notes available.</p>
      )}
    </div>
  );
}

export default NotesList;