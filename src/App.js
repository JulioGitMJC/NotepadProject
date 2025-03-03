import './App.css';
import { useState, useRef, useEffect } from 'react';
import { useAllNotes } from "./AllNotes";
import { useSelectedNotes } from "./SelectedNotes";

function App() {
  const { notes, setNotes, createNewNote, 
    updateNoteTitle, updateNoteContent} = useAllNotes();

    // Tracks selected note
    const [selectedNote, setSelectedNote] = useState(null);
    const [tempTitle, setTempTitle] = useState("");
    // Tracks multiple selected notes
    const [activeNoteId, setActiveNoteId] = useState([]);
    
  // Handles single selection
  const handleSelectNote = (id) => {
    setActiveNoteId(id);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if(!event.target.closest ('.NewNote') && !event.target.closest('.DeleteButtonContainer') &&
        !event.target.closest('.modal-overlay'))
        {setActiveNoteId([]);}};
        document.addEventListener('click' , handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
      },[]);

  // Handles long press
  const handleLongPress = (id) => {
    setActiveNoteId((prev) => {
      if (prev.includes(id)) {
      // If the note is already selected, remove it
        return prev.filter((noteId) => noteId !== id);
      } else {
      // If the note is not selected, add it
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

  const OpenNoteModal = () => {
    setSelectedNote(null);
    };

  // Save the title
  const saveTitle = (updateNoteTitle) => {
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
      setNotes(notes.filter((note) => !activeNoteId.includes(note.id))); // Delete all selected notes
      setActiveNoteId([]); // Clear the selection
    }
  };


  return (
    <div className="App">

      <div className='SidebarContainer'>
        {/* Sidebar with "Create New Note" button */}
        <button className="CreateNote" onClick={createNewNote}>
        Create New Note</button>

      {/* Sidebar*/}
        <div className="Sidebar">

        {/* Display the new note */}
        {notes.map((note) => (
      <div
      key={note.id}
      // Checks if note is selected
      className={`NewNote ${activeNoteId.includes(note.id) ? 'active' : ''}`}
      onMouseDown={() => startPressTimer(note.id)}
      onMouseUp={cancelPressTimer}
      onMouseLeave={cancelPressTimer}
      >
    {/* Display Title */}
    {/* Use this line of code if you just want to click on the note title rather than the icon */}
    {/* <p className="NoteTitle" onClick={() => openTitleModal(note)}>{note.title}</p> */}
    {/* and remove the below */}
    <div className="NoteHeader">
      <p className="NoteTitle">{note.title}</p>
        <span className="EditIcon" onClick={() => openTitleModal(note)}>
          ✏️  
        </span>
    </div>

    {/* Edit content of the note */}
    <textarea
      className="NoteContent"
      value={note.content}
      onChange={(e) => updateNoteContent(note.id, e.target.value)}
      placeholder="Write your note here..."
    ></textarea>
  </div>
))}
        </div>

      {/* Name each note using modal box*/}
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
            {/* Save */}
            <button onClick={() => {saveTitle(updateNoteTitle);
              closeTitleModal()}}
              >Save</button>
              {/* Delete */}
            <button onClick={() => {deleteNote(selectedNote.id);
            closeTitleModal()}} 
            >Delete</button>
            {/* Open */}
            <button onClick={OpenNoteModal}>Open</button>
            {/* Cancel */}
            <button onClick={closeTitleModal}>Cancel</button>
          </div>
        </div>
      </div>
      )}

        {/*button container */}
        <div className='TopButtonsContainer'>

        <div className="DeleteButtonContainer">

          {/* Delete button */}
        <button
        className={`DeleteNoteButton ${activeNoteId.length === 0 ? 'disabled' : ''}`}
        onClick={deleteActiveNote}
        disabled={activeNoteId.length === 0} // Disable if no notes are selected
        >Delete</button>

{activeNoteId.length === 0 && (
    <div className="Tooltip">Long press on a note item to select</div>
  )}
</div>
          
          {/* fonts button*/}
          <button className="FontsButton HoverEffect">
          Fonts </button>
        </div>

        {/*button container */}
        <div className='BottomButtonsContainer'>
          {/* Download button */}
          <button className="DownloadButton HoverEffect">
          Download </button>
          {/* font's size button*/}
          <button className="FontSizeButton HoverEffect">
          Font Size </button>
          </div>
      </div>
      
    </div>
  );
}
export default App;