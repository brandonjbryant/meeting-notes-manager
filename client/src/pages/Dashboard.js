import React, { useState } from "react";
import {
  TextField,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import axios from "axios";

const Dashboard = () => {
  const [transcript, setTranscript] = useState(""); // Stores the meeting transcript
  const [notes, setNotes] = useState(""); // Stores generated meeting notes
  const [actionItems, setActionItems] = useState([]); // Stores extracted action items
  const [loading, setLoading] = useState(false); // Tracks loading state
  const [aiSummary, setAiSummary] = useState(""); // Stores AI-generated summary
  const [tags] = useState(["Meeting", "Action Items", "Transcript", "Notes"]); // Available tags
  const [selectedTags, setSelectedTags] = useState([]); // Selected tags for filtering
  const [question, setQuestion] = useState(""); // Stores the user's question
  const [answer, setAnswer] = useState(""); // Stores the AI-generated answer

  // Function to handle file upload for audio transcription
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      alert("Please select a file to upload!");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://localhost:5000/transcribe-audio", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data && response.data.transcript) {
        setTranscript(response.data.transcript);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
      alert("Failed to transcribe audio. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle document upload for text extraction
  const handleDocumentUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      alert("Please select a document to upload!");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://localhost:5000/extract-text", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data && response.data.text) {
        setTranscript(response.data.text);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error extracting text from document:", error);
      alert("Failed to extract text. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to generate meeting notes from the transcript
  const handleGenerateNotes = async () => {
    if (!transcript) {
      alert("Please enter a meeting transcript first!");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/generate-notes", { transcript });
      if (response.data && response.data.notes) {
        setNotes(response.data.notes);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error generating notes:", error);
      alert("Failed to generate notes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to retrieve saved notes by ID
  const handleRetrieveNotes = async (noteId) => {
    if (!noteId) {
      alert("Please enter a valid note ID!");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/notes/${noteId}`);
      if (response.data && response.data.notes) {
        setNotes(response.data.notes);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error retrieving notes:", error);
      alert("Failed to retrieve notes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to extract action items dynamically
  const handleExtractActionItems = async () => {
    if (!notes) {
      alert("Please generate meeting notes first!");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/extract-action-items", { notes });
      if (response.data && response.data.actionItems) {
        setActionItems(response.data.actionItems);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error extracting action items:", error);
      alert("Failed to extract action items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to save action items to the backend
  const handleSaveActionItems = async () => {
    try {
      await axios.post("http://localhost:5000/save-action-items", { actionItems });
      alert("Action items saved successfully!");
    } catch (error) {
      console.error("Error saving action items:", error);
      alert("Failed to save action items.");
    }
  };

  // Function to export action items as a .txt file
  const handleExportActionItems = () => {
    const blob = new Blob([actionItems.join("\n")], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "action_items.txt";
    link.click();
  };

  // Function to generate AI summary
  const handleGenerateAiSummary = async () => {
    if (!notes) {
      alert("Please generate meeting notes first!");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/generate-summary", { notes });
      if (response.data && response.data.summary) {
        setAiSummary(response.data.summary);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error generating AI summary:", error);
      alert("Failed to generate AI summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to ask a question about the notes
  const handleAskQuestion = async () => {
    if (!notes || !question) {
      alert("Please generate notes and enter a question first!");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/ask-question", { notes, question });
      if (response.data && response.data.answer) {
        setAnswer(response.data.answer);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error asking question:", error);
      alert("Failed to get an answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle tag selection
  const handleTagClick = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Filter notes based on selected tags
  const filteredNotes = selectedTags.length
    ? notes.split("\n").filter((note) =>
        selectedTags.some((tag) => note.toLowerCase().includes(tag.toLowerCase()))
      )
    : notes.split("\n");

  // Placeholder functions for future features
  const handleCalendarClick = () => alert("Calendar feature coming soon!");
  const handlePersonalLogClick = () => alert("Personal Log feature coming soon!");
  const handleRecentMeetingsClick = () => alert("Recent Meetings feature coming soon!");
  const handleGenerateMeetingMinutesClick = () => alert("Generate Meeting Minutes feature coming soon!");
  const handleGenerateMeetingSummariesClick = () => alert("Generate Meeting Summaries feature coming soon!");

  return (
    <div style={{ padding: "20px" }}>
      <h1>Meeting Notes Manager</h1>

      {/* Organizer Boxes */}
      <Grid container spacing={3}>
        {/* Calendar */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper elevation={3} style={{ padding: "20px" }}>
            <Typography variant="h6">Calendar</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCalendarClick}
              style={{ marginTop: "10px" }}
            >
              Open Calendar
            </Button>
          </Paper>
        </Grid>

        {/* Generate Meeting Minutes */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper elevation={3} style={{ padding: "20px" }}>
            <Typography variant="h6">Generate Meeting Minutes</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerateMeetingMinutesClick}
              style={{ marginTop: "10px" }}
            >
              Generate
            </Button>
          </Paper>
        </Grid>

        {/* Tags */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper elevation={3} style={{ padding: "20px" }}>
            <Typography variant="h6">Tags</Typography>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" }}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onClick={() => alert(`Filter by ${tag} coming soon!`)}
                  color="primary"
                  clickable
                />
              ))}
            </div>
          </Paper>
        </Grid>

        {/* Today's Schedule */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper elevation={3} style={{ padding: "20px" }}>
            <Typography variant="h6">Today's Schedule</Typography>
            <Typography variant="body2" style={{ marginTop: "10px" }}>
              Placeholder for today's schedule.
            </Typography>
          </Paper>
        </Grid>

        {/* Personal Log */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper elevation={3} style={{ padding: "20px" }}>
            <Typography variant="h6">Personal Log</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handlePersonalLogClick}
              style={{ marginTop: "10px" }}
            >
              Open Log
            </Button>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper elevation={3} style={{ padding: "20px" }}>
            <Typography variant="h6">Recent Activity</Typography>
            <Typography variant="body2" style={{ marginTop: "10px" }}>
              Placeholder for recent activity.
            </Typography>
          </Paper>
        </Grid>

        {/* Recent Meetings */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper elevation={3} style={{ padding: "20px" }}>
            <Typography variant="h6">Recent Meetings</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleRecentMeetingsClick}
              style={{ marginTop: "10px" }}
            >
              View Meetings
            </Button>
          </Paper>
        </Grid>

        {/* Generate Meeting Summaries */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper elevation={3} style={{ padding: "20px" }}>
            <Typography variant="h6">Generate Meeting Summaries</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerateMeetingSummariesClick}
              style={{ marginTop: "10px" }}
            >
              Generate
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Transcript Input Section */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Enter Meeting Transcript</h3>
        <TextField
          label="Meeting Transcript"
          multiline
          rows={4}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          variant="outlined"
          fullWidth
          style={{ marginBottom: "10px" }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleGenerateNotes}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Generate Notes"}
        </Button>
      </div>

      {/* File Upload Section */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Upload Audio File for Transcription</h3>
        <input type="file" onChange={handleFileUpload} />
      </div>

      {/* Document Upload Section */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Upload Document for Text Extraction</h3>
        <input type="file" onChange={handleDocumentUpload} />
      </div>

      {/* Retrieve Notes Section */}
      <TextField
        label="Retrieve Notes by ID"
        variant="outlined"
        fullWidth
        style={{ marginBottom: "20px" }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleRetrieveNotes(e.target.value);
          }
        }}
      />

      {/* Notes Section */}
      {notes && (
        <div style={{ marginBottom: "20px" }}>
          <h3>Generated Meeting Notes</h3>
          <TextField
            multiline
            rows={6}
            value={notes}
            variant="outlined"
            fullWidth
            disabled
          />
        </div>
      )}

      {/* Tags-Based Filtering */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Filter by Tags</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              onClick={() => handleTagClick(tag)}
              color={selectedTags.includes(tag) ? "primary" : "default"}
              clickable
            />
          ))}
        </div>
        <div style={{ marginTop: "20px" }}>
          {filteredNotes.map((note, index) => (
            <Typography key={index} variant="body1">
              {note}
            </Typography>
          ))}
        </div>
      </div>

      {/* Ask a Question Section */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Ask a Question About the Notes</h3>
        <TextField
          label="Enter your question"
          variant="outlined"
          fullWidth
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={{ marginBottom: "10px" }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleAskQuestion}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Ask Question"}
        </Button>
        {answer && (
          <div style={{ marginTop: "20px" }}>
            <h4>Answer:</h4>
            <p>{answer}</p>
          </div>
        )}
      </div>

      {/* Extract Action Items Button */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleExtractActionItems}
        disabled={loading}
        style={{ marginBottom: "20px" }}
      >
        {loading ? <CircularProgress size={24} /> : "Extract Action Items"}
      </Button>

      {/* Display Extracted Action Items */}
      {actionItems.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Extracted Action Items</h3>
          <List>
            {actionItems.map((item, index) => (
              <ListItem key={index}>
                <ListItemText primary={item} />
              </ListItem>
            ))}
          </List>

          {/* Save Action Items Button */}
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSaveActionItems}
            style={{ marginRight: "10px" }}
          >
            Save Action Items
          </Button>

          {/* Export Action Items Button */}
          <Button
            variant="contained"
            color="success"
            onClick={handleExportActionItems}
          >
            Export Action Items
          </Button>
        </div>
      )}

      {/* AI Summary Section */}
      {notes && (
        <div style={{ marginTop: "20px" }}>
          <Button
            variant="contained"
            color="info"
            onClick={handleGenerateAiSummary}
            disabled={loading}
            style={{ marginBottom: "20px" }}
          >
            {loading ? <CircularProgress size={24} /> : "Generate AI Summary"}
          </Button>

          {aiSummary && (
            <div style={{ marginTop: "20px" }}>
              <h3>AI-Generated Summary</h3>
              <p>{aiSummary}</p>
            </div>
          )}
        </div>
      )}

      {/* Placeholder for Future Features */}
      <div style={{ marginTop: "40px" }}>
        <h3>Future Features</h3>
        <p>Additional components like Meeting Scheduler, Real-Time Collaboration, etc., will be added here.</p>
      </div>
    </div>
  );
};

export default Dashboard;