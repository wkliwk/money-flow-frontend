// src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link as NavLink } from 'react-router-dom'; // Use Link as NavLink
import AddExpense from './AddExpense';
import ExpenseList from './ExpenseList';
import EditExpense from './EditExpense';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
function App() {
  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Money Flow App</Typography>
        </Toolbar>
      </AppBar>
      <Container>
        <Router>
          <List component="nav">
            <ListItem button>
              <NavLink to="/" style={{ textDecoration: 'none' }}>
                <ListItemText primary="Expense List" />
              </NavLink>
            </ListItem>
            <ListItem button>
              <NavLink to="/add" style={{ textDecoration: 'none' }}>
                <ListItemText primary="Add Expense" />
              </NavLink>
            </ListItem>
          </List>
          <Routes>
            <Route path="/" element={<ExpenseList />} />
            <Route path="/add" element={<AddExpense />} />
            <Route path="/edit/:id" element={<EditExpense />} />
          </Routes>
        </Router>
      </Container>
    </div>
  );
}

export default App;
