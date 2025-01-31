import logo from './logo.svg';
import './App.css';

function App() {
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

      </nav>

      {/* Content */}          
      <header className="App-header">
        <p>Hello World!</p>
      </header>
    </div>
  );
}

export default App;
