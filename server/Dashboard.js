import React, { useState } from "react";
import {
  TextField,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import axios from "axios";

const Dashboard = () => {
  const [notes, setNotes] = useState(""); // Stores meeting notes
  const [actionItems, setActionItems] = useState([]); // Stores extracted action items
  const [loading, setLoading] = useState(false); // Tracks loading state

  // Function to extract action items dynamically
  const handleExtractActionItems = async () => {
    if (!notes) {
      alert("Please enter or generate meeting notes first!");
      return;
    }

    setLoading(true); // Show loading state
    try {
      // Replace with your backend API endpoint
      const response = await axios.post(
        "http://localhost:5000/extract-action-items",
        {
          notes, // Send the meeting notes to the backend
        }
      );

      // Update the state with the extracted action items
      setActionItems(response.data.actionItems);
    } catch (error) {
      console.error("Error extracting action items:", error);
      alert("Failed to extract action items. Please try again.");
    } finally {
      setLoading(false); // Hide loading state
    }
  };

  // Function to save action items to the backend
  const handleSaveActionItems = async () => {
    try {
      await axios.post("http://localhost:5000/save-action-items", {
        actionItems,
      });
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

  return (
    <div style={{ padding: "20px" }}>
      <h1>Meeting Notes Manager</h1>

      {/* Notes Section */}
      <TextField
        label="Meeting Notes"
        multiline
        rows={4}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        variant="outlined"
        fullWidth
        style={{ marginBottom: "20px" }}
      />

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
    </div>
  );
};

export default Dashboard;