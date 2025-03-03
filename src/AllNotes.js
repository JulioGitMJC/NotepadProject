import { useState } from "react";

export function useAllNotes() {
  const [notes, setNotes] = useState([]);

  // Function to add a new note
  const createNewNote = () => {
    const newNote = { id: Date.now(), title: "Untitled", content: "" };
    setNotes([newNote, ...notes]);
  };

  // Function to update a note's title
  const updateNoteTitle = (id, newTitle) => {
    setNotes(notes.map(note => (note.id === id ? { ...note, title: newTitle } : note)));
  };

  // Function to update a note's content
  const updateNoteContent = (id, newContent) => {
    setNotes(notes.map(note => (note.id === id ? { ...note, content: newContent } : note)));
  };

  return {
    notes,
    setNotes,
    createNewNote,
    updateNoteTitle,
    updateNoteContent,
  };
}


