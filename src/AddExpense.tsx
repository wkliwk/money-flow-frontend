import React, { useState } from 'react';
import axios from 'axios';

const AddExpense: React.FC = () => {
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);

  const addExpense = async () => {
    try {
      const response = await axios.post('http://localhost:3000/expenses', {
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
      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      <button onClick={addExpense}>Add Expense</button>
    </div>
  );
}

export default AddExpense;
