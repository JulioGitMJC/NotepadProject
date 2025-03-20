import './App.css';
import { useState, useRef, useEffect } from 'react';
import { useAllNotes } from "./AllNotes";

function App() {
  const { notes, setNotes, updateNoteTitle, updateNoteContent } = useAllNotes();

  // Tracks selected note
  const [selectedNote, setSelectedNote] = useState(null);
  const [tempTitle, setTempTitle] = useState("");
  const [noteContent, setNoteContent] = useState(""); // Tracks the content of the opened note
  
  // Tracks multiple selected notes
  const [activeNoteId, setActiveNoteId] = useState([]);
  
  // Tracks font settings
  const [fontStyle, setFontStyle] = useState("Arial");
  const [fontSize, setFontSize] = useState(16);

  // Handles single selection
  const handleSelectNote = (id) => {
    setActiveNoteId(id);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.NewNote') && 
          !event.target.closest('.DeleteButtonContainer') &&
          !event.target.closest('.modal-overlay')) {
        setActiveNoteId([]);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Handles long press
  const handleLongPress = (id) => {
    setActiveNoteId((prev) => {
      if (prev.includes(id)) {
        return prev.filter((noteId) => noteId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const pressTimer = useRef(null);
  // Start long press timer
  const startPressTimer = (id) => {
    if (!pressTimer.current) {
      pressTimer.current = setTimeout(() => handleLongPress(id), 500);
    }
  };

  // Cancel long press timer
  const cancelPressTimer = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  // Open the title modal
  const openTitleModal = (note) => {
    setSelectedNote(note);
    setTempTitle(note.title);
  };

  // Close the modal
  const closeTitleModal = () => {
    setSelectedNote(null);
  };

  // Save the title
  const saveTitle = () => {
    if (selectedNote) {
      updateNoteTitle(selectedNote.id, tempTitle);
    }
  };

  const deleteNote = (id) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  // Delete all selected notes
  const deleteActiveNote = () => {
    if (activeNoteId.length > 0) {
      setNotes(notes.filter((note) => !activeNoteId.includes(note.id)));
      setActiveNoteId([]);
    }
  };

  // Create new note and open the modal automatically
  const createNewNote = () => {
    const newNote = {
      id: Date.now(),
      title: "Untitled",
      content: ""
    };
    setNotes([...notes, newNote]);
    openTitleModal(newNote);
  };

  // Open note content in textarea
  const openNote = (note) => {
    setSelectedNote(note);
    setNoteContent(note.content);
  };

  // Update note content when typing
  const handleNoteContentChange = (e) => {
    setNoteContent(e.target.value);
    if (selectedNote) {
      updateNoteContent(selectedNote.id, e.target.value);
    }
  };

  return (
    <div className="App">
      <div className='SidebarContainer'>
        {/* Sidebar with "Create New Note" button */}
        <button className="CreateNote" onClick={createNewNote}>Create New Note</button>

        {/* Sidebar */}
        <div className="Sidebar">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`NewNote ${activeNoteId.includes(note.id) ? 'active' : ''}`}
              onMouseDown={() => startPressTimer(note.id)}
              onMouseUp={cancelPressTimer}
              onMouseLeave={cancelPressTimer}
            >
              <div className="NoteHeader">
                <p className="NoteTitle">{note.title}</p>
                <span className="EditIcon" onClick={() => openTitleModal(note)}>✏️</span>
              </div>
              
              <textarea disabled
                className="NoteContent"
                value={note.content}
                onChange={(e) => updateNoteContent(note.id, e.target.value)}
                placeholder="Write your note here..."
                style={{ fontFamily: fontStyle, fontSize: fontSize + 'px' }}
              ></textarea>
            </div>
          ))}
        </div>

        {/* Name each note using modal box */}
        {selectedNote && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Edit Note Title</h2>
              <input 
                type="text" 
                value={tempTitle === 'Untitled' ? "" : tempTitle}
                placeholder="Please Enter Your Note's Title"
                onChange={(e) => setTempTitle(e.target.value)}
              />
              <div className="modal-buttons">
                <button onClick={() => { saveTitle(); closeTitleModal(); }}>Save</button>
                <button onClick={() => openNote(selectedNote)}>Open</button>
                <button className='UpdateButton' onClick={() => { updateNoteContent(selectedNote.id, noteContent); closeTitleModal(); }}>Update</button>
                <button onClick={closeTitleModal}>Cancel</button>
                <button onClick={() => { deleteNote(selectedNote.id); closeTitleModal(); }}>Delete</button>
              </div>
            </div>
          </div>
        )}

        <div className='TopButtonsContainer'>
          <button className="FontsButton HoverEffect" onClick={() => setFontStyle(fontStyle === 'Arial' ? 'Courier New' : 'Arial')}>Fonts</button>
        </div>

        <div className='BottomButtonsContainer'>
          <button className="FontSizeButton HoverEffect" onClick={() => setFontSize(fontSize + 2)}>Font Size +</button>
          <button className="FontSizeButton HoverEffect" onClick={() => setFontSize(fontSize - 2)}>Font Size -</button>
        </div>
      </div>

      <textarea 
        className='NoteContent' 
        value={noteContent} 
        onChange={handleNoteContentChange} 
        placeholder="Edit your note here..."
        style={{ fontFamily: fontStyle, fontSize: fontSize + 'px' }}
      />
    </div>
  );
}

export default App;
