import React, { useState } from 'react';
import axiosInstance from './axiosInstance'; // Import the Axios instance
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

const AddExpense: React.FC = () => {
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);

  const addExpense = async () => {
    try {
      const response = await axiosInstance.post('/api/expenses', {
        description,
        amount,
      });
      console.log('Expense added:', response.data);
      // You can update your UI or state after a successful request.
    } catch (error) {
      console.error('Error adding expense:', error);
      // Handle errors or show a message to the user.
    }
  }

  return (
    <div>
      <h2>Add Expense</h2>
      <TextField
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <TextField
        label="Amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={addExpense}
      >
        Add Expense
      </Button>
    </div>
  );
}

export default AddExpense;
