# Meeting Notes Manager

An AI-powered application for managing meeting notes, extracting action items, and enabling real-time collaboration. Built with a FastAPI backend and a React frontend, this app leverages OpenAI's GPT model for intelligent insights and automation.

---

## Features

- **Generate Notes**: Automatically generate meeting notes by inputting attendees, discussion points, and additional context.
- **Retrieve Saved Notes**: Access previously saved notes by entering a note ID.
- **Extract Action Items**: Use AI to extract actionable items and key decisions from meeting notes.
- **Audio Transcription**: Upload audio files and convert them into text using AI-powered transcription.
- **Ask a Question**: Query meeting notes with AI-generated answers based on the content.
- **Real-Time Collaboration**: Enable seamless teamwork with WebSocket-based real-time updates.

---

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, OpenAI GPT, WebSocket
- **Frontend**: React, Material-UI
- **Database**: SQLite (development), scalable to PostgreSQL
- **Other Tools**: Axios for API calls, WebSocket for real-time collaboration

---

## Setup Instructions

### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
