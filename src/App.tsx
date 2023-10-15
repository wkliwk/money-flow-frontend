import React from 'react';
import logo from './logo.svg';
import './App.css';
import AddExpense from './AddExpense'; // Import the AddExpense component

function App() {
  return (
    <div className="App">
      <h1>Money Flow App</h1>
      <AddExpense /> {/* Render the AddExpense component */}
      {/* Other components or content can go here */}
    </div>
  );
}

export default App;
