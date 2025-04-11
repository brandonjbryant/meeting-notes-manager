import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles"; // Import ThemeProvider and createTheme
import CssBaseline from "@mui/material/CssBaseline"; // Optional: Normalize styles
import Dashboard from "./pages/Dashboard";
import "./App.css";

// Create a default theme
const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Optional: Provides consistent baseline styles */}
      <div>
        <Dashboard />
      </div>
    </ThemeProvider>
  );
}

export default App;
