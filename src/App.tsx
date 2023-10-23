import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link as NavLink,
} from 'react-router-dom';
import AddExpense from './components/AddExpense';
import ExpenseList from './components/ExpenseList';
import EditExpense from './components/EditExpense';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

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
          <Tabs value={window.location.pathname} indicatorColor="primary">
            <Tab label="Expense List" value="/" to="/" component={NavLink} />
            <Tab
              label="Add Expense"
              value="/add"
              to="/add"
              component={NavLink}
            />
          </Tabs>
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
