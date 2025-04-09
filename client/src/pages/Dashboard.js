import React, { useState } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone"; // Import react-dropzone
import './App.css'; // Ensure the CSS file is imported

const Dashboard = () => {
  const [attendees, setAttendees] = useState("");
  const [discussionPoints, setDiscussionPoints] = useState("");
  const [context, setContext] = useState("");
  const [transcript, setTranscript] = useState(""); // State for transcript content
  const [attachments, setAttachments] = useState([]); // State for attachments
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [noteId, setNoteId] = useState(""); // State for the note ID input
  const [retrievedNote, setRetrievedNote] = useState(null); // State for the retrieved note

  // Function to handle generating meeting notes
  const handleGenerateNotes = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:8080/generate-notes/", {
        attendees: attendees.split(",").map((item) => item.trim()),
        discussion_points: discussionPoints.split(",").map((item) => item.trim()),
        additional_context: context,
        transcript: transcript, // Ensure this field is included
      });
      setNotes(response.data.notes);
    } catch (error) {
      console.error("Error generating notes:", error);
      alert("Failed to generate notes. Please check your input or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle file upload for transcript
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://127.0.0.1:8080/upload-file/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setTranscript(response.data.transcript); // Set the processed transcript
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload and process the file. Please try again.");
    }
  };

  // Function to handle drag-and-drop file uploads
  const onDrop = (acceptedFiles) => {
    setAttachments([...attachments, ...acceptedFiles]); // Add new files to the attachments state
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleDownloadNotes = () => {
    const element = document.createElement("a");
    const file = new Blob([notes], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "MeetingNotes.txt";
    document.body.appendChild(element);
    element.click();
  };

  const handleRetrieveNote = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8080/notes/${noteId}`);
      setRetrievedNote(response.data); // Set the retrieved note in state
    } catch (error) {
      console.error("Error retrieving note:", error);
      alert("Failed to retrieve note. Please check the ID and try again.");
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Meeting Notes Manager</h1>
      </header>
      <div>
        <label>Attendees (comma-separated):</label>
        <input
          type="text"
          value={attendees}
          onChange={(e) => setAttendees(e.target.value)}
          placeholder="e.g., Alice, Bob, Charlie"
        />
      </div>
      <div>
        <label>Discussion Points (comma-separated):</label>
        <input
          type="text"
          value={discussionPoints}
          onChange={(e) => setDiscussionPoints(e.target.value)}
          placeholder="e.g., Project deadlines, Budget allocation"
        />
      </div>
      <div>
        <label>Additional Context:</label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Provide any additional context for the meeting..."
        ></textarea>
      </div>
      <div>
        <label>Transcript (paste content):</label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste the meeting transcript here..."
        ></textarea>
      </div>
      <div>
        <label>Upload Transcript File:</label>
        <input type="file" accept=".txt,.pdf,.docx,.md" onChange={handleFileUpload} />
        <small>Upload a .txt file containing the meeting transcript.</small>
      </div>
      <div>
        <label>Attachments (drag and drop files):</label>
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? "active" : ""}`}
          style={{
            border: "2px dashed #4a90e2",
            borderRadius: "8px",
            padding: "20px",
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: isDragActive ? "#f0f8ff" : "#ffffff",
          }}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the files here...</p>
          ) : (
            <p>Drag and drop files here, or click to select files</p>
          )}
        </div>
        <ul>
          {attachments.map((file, index) => (
            <li key={index}>{file.name}</li>
          ))}
        </ul>
      </div>
      <button onClick={handleGenerateNotes} disabled={isLoading}>
        {isLoading ? "Generating..." : "Generate Notes"}
      </button>
      {notes && (
        <div className="Generated-notes">
          <h2>Generated Notes:</h2>
          <p><strong>Note ID:</strong> {retrievedNote?.id || "Not available"}</p> {/* Display Note ID */}
          <pre>{notes}</pre>
          <button onClick={handleDownloadNotes}>Download Notes</button>
        </div>
      )}
      <div>
        <h2>Retrieve Saved Notes</h2>
        <label>Enter Note ID:</label>
        <input
          type="text"
          value={noteId}
          onChange={(e) => setNoteId(e.target.value)}
          placeholder="Enter the note ID"
        />
        <button onClick={handleRetrieveNote}>Retrieve Note</button>
      </div>

      {retrievedNote && (
        <div>
          <h3>Retrieved Note:</h3>
          <p><strong>Attendees:</strong> {retrievedNote.attendees}</p>
          <p><strong>Discussion Points:</strong> {retrievedNote.discussion_points}</p>
          <p><strong>Additional Context:</strong> {retrievedNote.additional_context}</p>
          <p><strong>Transcript:</strong> {retrievedNote.transcript}</p>
          <p><strong>Notes:</strong></p>
          <pre>{retrievedNote.notes}</pre>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

