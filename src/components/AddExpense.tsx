import React, { useState } from 'react';
import ButtonWrapper from './common/ButtonWrapper';
import TextFieldWrapper from './common/TextFieldWrapper';
import { createExpense } from '../services/api'; // Import the API service

const AddExpense: React.FC = () => {
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);

  const addExpense = async () => {
    try {
      const newExpense = await createExpense({
        _id: '',
        description,
        amount,
      });
      console.log('Expense added:', newExpense);
      // You can update your UI or state after a successful request.
    } catch (error) {
      console.error('Error adding expense:', error);
      // Handle errors or show a message to the user.
    }
  }
  return (
    <div>
      <h2>Add Expense</h2>
      <TextFieldWrapper
        label="Description"
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <TextFieldWrapper
        label="Amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      <ButtonWrapper label="Add Expense" onClick={addExpense} />
    </div>
  );
}

export default AddExpense;
