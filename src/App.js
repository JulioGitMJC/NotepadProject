import logo from './logo.svg';
import './App.css';
import { useState, useRef } from 'react';

function App() {
  const [text, setText] = useState('');
  const RefForTextArea = useRef(null);
  const [fontSize, setFontSize] = useState("15px");

  const TextAreaChange = (Event) => {
    setText(Event.target.value);
  
    const textArea = RefForTextArea.current;
    if (textArea) {
      textArea.style.height = "auto";
      textArea.style.height = `${textArea.scrollHeight}px`;
    }
  };

  const FontSizeChange = (size) => {
    setFontSize(`${size}px`);
  }

  return (
    <div className="App">

      {/* Menu Bar */}
      <nav className="menu-bar">
        {/* File Menu */}
        <div className="dropdown">
          <button className="dropbtn">File</button>
          <div className="dropdown-content">
            <button onClick={() => console.log("Open clicked")}>Open</button>
            <button onClick={() => console.log("Save clicked")}>Save</button>
          </div>
        </div>

        {/* View Menu */}
        <div className="dropdown">
          <button className="dropbtn">View</button>
          <div className="dropdown-content">
            <button onClick={() => console.log("Help clicked")}>Help</button>
            <button onClick={() => console.log("Publisher clicked")}>Publisher</button>
          </div>
        </div>

        <div className="dropdown">
          <button className="dropbtn">Size</button>
          <div className="dropdown-content">
            {[10, 15, 20, 25, 30, 35].map((size) => (
              <button key={size} onClick={() => FontSizeChange(size)}>
                {size} px
              </button>
            ))}
          </div>
        </div>

      </nav>

      {/* Content */}          
      <header className="App-header">
        <textarea 
          ref={RefForTextArea} 
          className='TextArea' 
          placeholder='Type here to create a note.' 
          value={text} 
          onChange={TextAreaChange} 
          style={{ fontSize: fontSize }}
        ></textarea> {/* This is where the user inputs their text */}
      </header>
    </div>
  );
}

export default App;
