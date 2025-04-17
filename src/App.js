import './App.css';
import { useState, useRef, useEffect } from 'react';
import { useAllNotes } from './AllNotes.js';


function App() {
  const { notes, setNotes } = useAllNotes();
  // Tracks selected note
  const [selectedNote, setSelectedNote] = useState(null);
  const [tempTitle, setTempTitle] = useState("");
  // Tracks the content of the opened note
  const [noteContent, setNoteContent] = useState("");

  // Tracks multiple selected notes
  const [activeNoteId, setActiveNoteId] = useState([]);

  // Tracks font settings
  const [fontStyle, setFontStyle] = useState("Arial");
  const [fontSize, setFontSize] = useState(16);

  // CreateNewNote button modal-box
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");

  // This will handle the modal login state
  const[LoginModel, setLoginModal] = useState(true);

  // States for Email and Password
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  // Handler for api requests

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:80/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
  
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        setLoginModal(false);
        console.log("Successfully logged in " + data.username);
        const notesRes = await fetch("http://localhost:80/api/notes", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${data.token}`
          }
        });
        
        const notesData = await notesRes.json();
        setNotes(notesData.notes);
        const unsaved = localStorage.getItem("unsavedText");
        if (unsaved) {
          setNoteContent(unsaved);
        }


        const lastId = localStorage.getItem("lastSelectedNoteId");
        if (lastId) {
          const foundNote = notesData.notes.find(note => note.id === Number(lastId));
          if (foundNote) {
            openNote(foundNote);
          }
        } else {
          const unsaved = localStorage.getItem("unsavedText");
          if (unsaved) {
            setNoteContent(unsaved);
          }
        }
      } else {
        const unsaved = localStorage.getItem("unsavedText");
        alert(data.error || "Login has failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong.");
    }
  };
  
  const handleRegister = async () => {
    try {
      const res = await fetch("http://localhost:80/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username: loginEmail.split("@")[0], email: loginEmail, password: loginPassword })
      });
  
      const data = await res.json();
      if (res.ok) {
        alert("Account created successfully! Now you can log in.");
      } else {
        alert(data.error || "Registration failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert("Something went wrong during registration.");
    }
  };

  const updateNoteContent = async (id, content) => {
    setNotes(prev =>
      prev.map(note => note.id === id ? { ...note, content } : note)
    );
  
    const token = localStorage.getItem("token");
    const updatedNotes = notes.map(note =>
      note.id === id ? { ...note, content } : note
    );
  
    await fetch("http://localhost:80/api/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ notes: updatedNotes })
    });
  };
  
  const updateNoteTitle = async (id, title) => {
    setNotes(prev =>
      prev.map(note => note.id === id ? { ...note, title } : note)
    );
  
    const token = localStorage.getItem("token");
    const updatedNotes = notes.map(note =>
      note.id === id ? { ...note, title } : note
    );
  
    await fetch("http://localhost:80/api/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ notes: updatedNotes })
    });
  };
  
  // Dark Mode
  const [darkMode, setDarkMode] = useState(false);
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

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

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (selectedNote) {
        updateNoteContent(selectedNote.id, noteContent);
        localStorage.setItem("lastSelectedNoteId", selectedNote.id);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [selectedNote, noteContent]);

  useEffect(() => {
    const textarea = document.querySelector('.NoteContent:not([disabled])');
    if (textarea) textarea.focus();
  }, [selectedNote]);
  
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

  const deleteNote = async (id) => {
    const updated = notes.filter(note => note.id !== id);
    setNotes(updated);
  
    const token = localStorage.getItem("token");
    await fetch("http://localhost:80/api/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ notes: updated })
    });
  };
  

  // Delete all selected notes
  const deleteActiveNote = async () => {
    if (activeNoteId.length > 0) {
      const updated = notes.filter(note => !activeNoteId.includes(note.id));
      setNotes(updated);        // 1. Update frontend
      setActiveNoteId([]);      // 2. Clear selection
  
      // 3. Save updated notes to backend
      const token = localStorage.getItem("token");
      if (token) {
        await fetch("http://localhost:80/api/notes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ notes: updated })
        });
      }
    }
  };
  

  // Open new note modal
  const openNewNoteModal = () => {
    setShowNewNoteModal(true);
    setNewNoteTitle("");
  };

  const showLoginModal = () => {
    setLoginModal(true);
  }

  // Create new note after user clicks save
  const confirmCreateNewNote = () => {
    const title = newNoteTitle.trim() || "Untitled";
    const newNote = {
      id: Date.now(),
      title: title,
      content: ""
    };
    setNotes([newNote, ...notes]);
    setShowNewNoteModal(false);
    setNoteContent("");
    setSelectedNote(null);
  };

  // Cancel function
  const cancelCreateNewNote = () => {
    setShowNewNoteModal(false);
    setNewNoteTitle("");
  };
  // Open note content in textarea
  const openNote = (note) => {
    setSelectedNote(note);
    setNoteContent(note.content);
    setTempTitle(note.title);
  };

  // Update note content when typing
  const handleNoteContentChange = (e) => {
    const text = e.target.value;
    setNoteContent(text);
    localStorage.setItem("unsavedText", text); // Save unsaved text
  
    if (selectedNote) {
      const updated = notes.map(note =>
        note.id === selectedNote.id ? { ...note, content: text } : note
      );
      setNotes(updated);
    }
  };
  
  

  return (
    <div className={`App ${darkMode ? 'dark-mode' : ''}`}>

      <div className='SidebarContainer'>
        {/* Sidebar with "Create New Note" button */}
        <button className="CreateNote HoverEffect" onClick={openNewNoteModal}>Create New Note</button>

        {/* Sidebar */}
        <div className="Sidebar">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`NewNote ${activeNoteId.includes(note.id) ? 'active' : ''}`}
              // handle long press
              onMouseDown={() => startPressTimer(note.id)}
              onMouseUp={cancelPressTimer}
              onMouseLeave={cancelPressTimer}
            >
              <div className="NoteHeader">
                <p className="NoteTitle">{note.title}</p>
                <span className='UpdateIcon' onClick={() => updateNoteContent(note.id, noteContent)}>⬆️</span>
                <span className="EditIcon" onClick={() => openTitleModal(note)}>✏️</span>
              </div>

              <div className="TxtContainer">
                <textarea disabled
                  className="NoteContent"
                  value={note.content}
                  onChange={(e) => updateNoteContent(note.id, e.target.value)}
                  placeholder="Click on ⬆️ to upload your notes here."
                  style={{ fontFamily: fontStyle, fontSize: fontSize + 'px' }}
                />
                <div
                  className="TextareaOverlay"
                  onMouseDown={(e) => { e.preventDefault(); startPressTimer(note.id); }}
                  onMouseUp={cancelPressTimer}
                  onMouseLeave={cancelPressTimer}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Create new note modal box */}
        {showNewNoteModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Create New Note</h2>
              <input
                type="text"
                value={newNoteTitle}
                placeholder="Please Enter Your Note's Title"
                onChange={(e) => setNewNoteTitle(e.target.value)}
                autoFocus
              />
              <div className="modal-buttons">
                <button onClick={confirmCreateNewNote}>Save</button>
                <button onClick={cancelCreateNewNote}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        {/* This is the Modal for the Login Popup*/}
        {LoginModel && (
          <div className="modal-overlay-login">
            <div className="modal">
              <h2>Login</h2>
              <input
                type="email"
                value={loginEmail}
                placeholder="Username"
                onChange={(e) => setLoginEmail(e.target.value)}
                autoFocus
              />
              <input
                type="password"
                value={loginPassword}
                placeholder="Password"
                onChange={(e) => setLoginPassword(e.target.value)}
                autoFocus
              />
              <div className="modal-buttons">
                <button onClick={handleLogin}>Login</button>
                <button onClick={handleRegister}>Register</button>
              </div>
            </div>
          </div>
        )}

        {/* Name each note using modal box when click on the ✏️ button*/}
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
                <button onClick={() => { openNote(selectedNote); closeTitleModal(); }}>Open</button>
                <button onClick={closeTitleModal}>Cancel</button>
                <button onClick={() => { deleteNote(selectedNote.id); closeTitleModal(); }}>Delete</button>
              </div>
            </div>
          </div>
        )}

        <div className='TopButtonsContainer'>
          <button className="ThemeButton HoverEffect" onClick={toggleTheme}> {darkMode ? 'Light Mode' : 'Dark Mode'}</button>
          <button
            className="SignOut HoverEffect"
            onClick={async () => {
              if (selectedNote) {
                await updateNoteContent(selectedNote.id, noteContent); // ✅ safe here
                localStorage.setItem("lastSelectedNoteId", selectedNote.id);
              }
              localStorage.removeItem("token");
              setLoginModal(true);
              setNotes([]);
              setSelectedNote(null);
              setNoteContent("");
              setActiveNoteId([]);
            }}            
            >
            Sign Out
            </button>


          {/* Font size buttons */}
          {/* <button className="FontSizeButton HoverEffect" onClick={() => setFontSize(fontSize + 2)}>Font Size +</button>
          <button className="FontSizeButton HoverEffect" onClick={() => setFontSize(fontSize - 2)}>Font Size -</button> */}
        </div>

        <div className="FontSizeContainer">
          <button
            className="FontSizeButton HoverEffect" onClick={() => setFontSize(fontSize + 2)}>
            ➕
          </button>

          <button
            className="FontSizeButton HoverEffect" onClick={() => setFontSize(fontSize - 2)}>
            ➖
          </button>
        </div>

        <div className='BottomButtonsContainer'>
          {/* Delete button */}
          <div className="DeleteButtonContainer">
            <button className={`DeleteNoteButton  ${activeNoteId.length === 0 ? 'disabled' : ''}`}
              onClick={deleteActiveNote} disabled={activeNoteId.length === 0} // Disable if no notes are selected
            >Delete
            </button>
            {activeNoteId.length === 0 && (
              <div className="Tooltip">Long press on a note item to select</div>)}
          </div>

          {/* Download Button */}
          <button
            className="DownloadButton HoverEffect"
            onClick={() => {
              const element = document.createElement("a");
              const file = new Blob([noteContent], { type: "text/plain" });
              const fileName =
                (selectedNote?.title || "note").replace(/[<>:"/\\|?*\x00-\x1F]/g, "_") + ".txt";
              element.href = URL.createObjectURL(file);
              element.download = fileName;
              document.body.appendChild(element);
              element.click();
              document.body.removeChild(element);
            }}
          >
            Download
          </button>
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
useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token || !notes) return;

  const sendToCache = async () => {
    try {
      await fetch("/api/notes/cache", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes }),
      });
    } catch (err) {
      console.error("Failed to send notes to cache", err);
    }
  };

  const interval = setInterval(sendToCache, 5000); // send to cache every 5s

  return () => clearInterval(interval);
}, [notes]);

export default App;
