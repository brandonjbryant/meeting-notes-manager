import React, { useState } from "react";
import axios from "axios";
import { TextField, Button, Typography, Container, Box, Paper, Input } from "@mui/material";
import AskQuestion from "./AskQuestion";

const Dashboard = () => {
  const [attendees, setAttendees] = useState("");
  const [discussionPoints, setDiscussionPoints] = useState("");
  const [context, setContext] = useState("");
  const [notes, setNotes] = useState("");
  const [noteId, setNoteId] = useState("");
  const [retrievedNote, setRetrievedNote] = useState(null);
  const [actionItems, setActionItems] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [transcribedText, setTranscribedText] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const socket = new WebSocket("ws://127.0.0.1:8080/ws/notes/1");

  socket.onmessage = (event) => {
    console.log("Update received:", event.data);
  };

  const sendUpdate = (update) => {
    socket.send(JSON.stringify(update));
  };

  const handleGenerateNotes = async () => {
    try {
      const response = await axios.post("http://127.0.0.1:8080/generate-notes/", {
        attendees: attendees.split(",").map((item) => item.trim()),
        discussion_points: discussionPoints.split(",").map((item) => item.trim()),
        additional_context: context,
      });
      setNotes(response.data.notes);
    } catch (error) {
      console.error("Error generating notes:", error);
      alert("Failed to generate notes. Please check your input or try again.");
    }
  };

  const handleRetrieveNote = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8080/notes/${noteId}`);
      setRetrievedNote(response.data);
    } catch (error) {
      console.error("Error retrieving note:", error);
      alert("Failed to retrieve note. Please check the note ID or try again.");
    }
  };

  const handleExtractActionItems = async () => {
    try {
      const response = await axios.post("http://127.0.0.1:8080/extract-action-items/", {
        notes: retrievedNote ? retrievedNote.notes : notes,
      });
      setActionItems(response.data.action_items);
    } catch (error) {
      console.error("Error extracting action items:", error);
      alert("Failed to extract action items. Please try again.");
    }
  };

  const handleAudioUpload = async (event) => {
    const file = event.target.files[0];
    setAudioFile(file);

    if (!file) return;

    const formData = new FormData();
    formData.append("audio", file);

    try {
      const response = await axios.post("http://127.0.0.1:8080/transcribe-audio/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setTranscribedText(response.data.transcription);
    } catch (error) {
      console.error("Error transcribing audio:", error);
      alert("Failed to transcribe audio. Please try again.");
    }
  };

  const handleAskQuestion = async () => {
    if (!question || !noteId) {
      alert("Please enter a question and a valid Note ID.");
      return;
    }

    try {
      console.log("Question:", question);
      console.log("Note ID:", noteId);

      const response = await axios.post("http://127.0.0.1:8080/ask-question/", {
        question: question,
        note_id: parseInt(noteId),
      });

      console.log("Response:", response.data);
      setAnswer(response.data.answer);
    } catch (error) {
      console.error("Error asking question:", error.response || error.message);
      alert("Failed to get an answer. Please check the Note ID or try again.");
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} style={{ padding: "20px", marginTop: "20px" }}>
        <Typography variant="h4" gutterBottom>
          Meeting Notes Manager
        </Typography>
        <Box mb={2}>
          <TextField
            fullWidth
            label="Attendees (comma-separated)"
            variant="outlined"
            margin="normal"
            value={attendees}
            onChange={(e) => setAttendees(e.target.value)}
          />
        </Box>
        <Box mb={2}>
          <TextField
            fullWidth
            label="Discussion Points (comma-separated)"
            variant="outlined"
            margin="normal"
            value={discussionPoints}
            onChange={(e) => setDiscussionPoints(e.target.value)}
          />
        </Box>
        <Box mb={2}>
          <TextField
            fullWidth
            label="Additional Context"
            variant="outlined"
            margin="normal"
            multiline
            rows={4}
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </Box>
        <Box mb={2}>
          <Button variant="contained" color="primary" fullWidth onClick={handleGenerateNotes}>
            Generate Notes
          </Button>
        </Box>
        {notes && (
          <Box mb={2}>
            <Typography variant="h6" gutterBottom>
              Generated Notes:
            </Typography>
            <Typography>{notes}</Typography>
          </Box>
        )}
        <Typography variant="h6" gutterBottom>
          Retrieve Saved Notes
        </Typography>
        <Box mb={2}>
          <TextField
            fullWidth
            label="Enter Note ID"
            variant="outlined"
            margin="normal"
            value={noteId}
            onChange={(e) => setNoteId(e.target.value)}
            placeholder="Enter the note ID"
          />
        </Box>
        <Box mb={2}>
          <Button variant="contained" color="secondary" fullWidth onClick={handleRetrieveNote}>
            Retrieve Note
          </Button>
        </Box>
        {retrievedNote && (
          <Box mb={2} className="center-container">
            <Typography variant="h6" gutterBottom>
              Retrieved Note:
            </Typography>
            <Box className="scrollable-container">
              <Typography><strong>Attendees:</strong> {retrievedNote.attendees}</Typography>
              <Typography><strong>Discussion Points:</strong> {retrievedNote.discussion_points}</Typography>
              <Typography><strong>Additional Context:</strong> {retrievedNote.additional_context}</Typography>
              <Typography><strong>Transcript:</strong></Typography>
              <pre>
                {retrievedNote.transcript.split(". ").map((sentence, index) => (
                  <span key={index}>
                    {sentence}.
                    <br />
                  </span>
                ))}
              </pre>
              <Typography><strong>Notes:</strong></Typography>
              <pre>{retrievedNote.notes}</pre>
            </Box>
          </Box>
        )}
        <Box mb={2}>
          <Button variant="contained" color="success" fullWidth onClick={handleExtractActionItems}>
            Extract Action Items
          </Button>
        </Box>
        {actionItems && (
          <Box mb={2}>
            <Typography variant="h6" gutterBottom>
              Extracted Action Items:
            </Typography>
            <Typography>{actionItems}</Typography>
          </Box>
        )}
        <Box mb={2}>
          <Input type="file" onChange={handleAudioUpload} />
        </Box>
        <Box mb={2}>
          <Typography variant="body1">Transcribed Text: {transcribedText}</Typography>
        </Box>
        <Box mb={2}>
          <Typography variant="h6" gutterBottom>
            Ask a Question
          </Typography>
          <TextField
            fullWidth
            label="Enter Note ID"
            variant="outlined"
            margin="normal"
            value={noteId}
            onChange={(e) => setNoteId(e.target.value)}
            placeholder="Enter the note ID"
          />
        </Box>
        <Box mb={2}>
          <TextField
            fullWidth
            label="Enter Your Question"
            variant="outlined"
            margin="normal"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about the note"
          />
        </Box>
        <Box mb={2}>
          <Button variant="contained" color="primary" fullWidth onClick={handleAskQuestion}>
            Get Answer
          </Button>
        </Box>
        {answer && (
          <Box mb={2}>
            <Typography variant="h6" gutterBottom>
              Answer:
            </Typography>
            <Typography>{answer}</Typography>
          </Box>
        )}
      </Paper>
      <AskQuestion />
    </Container>
  );
};

export default Dashboard;
