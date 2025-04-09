import React, { useState } from "react";

function AddNoteForm({ addNote }) {
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (id && title && content) {
      addNote({ id: parseInt(id), title, content });
      setId("");
      setTitle("");
      setContent("");
    } else {
      alert("All fields are required!");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
      <h2>Add a New Note</h2>
      <input
        type="number"
        placeholder="ID"
        value={id}
        onChange={(e) => setId(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <button type="submit">Add Note</button>
    </form>
  );
}

export default AddNoteForm;