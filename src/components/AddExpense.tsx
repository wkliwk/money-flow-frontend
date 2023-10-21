import React, { useState } from 'react';
import ButtonWrapper from './common/ButtonWrapper';
import TextFieldWrapper from './common/TextFieldWrapper';
import { createExpense } from '../services/api'; // Import the API service

const AddExpense: React.FC = () => {
  const [owner, setOwner] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [parent, setParent] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [profit, setProfit] = useState<number>(0);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [amount, setAmount] = useState<number>(0);


  const addExpense = async () => {
    try {
      const newExpense = await createExpense({
        owner,
        description,
        purpose,
        currentLocation,
        type,
        parent,
        status,
        profit,
        startDate: startDate || undefined, // Set to null if not provided
        endDate: endDate || undefined,       // Set to null if not provided
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
        label="Owner"
        type="text"
        value={owner}
        onChange={(e) => setOwner(e.target.value)}
      />
      <TextFieldWrapper
        label="Description"
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <TextFieldWrapper
        label="Purpose"
        type="text"
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
      />
      <TextFieldWrapper
        label="Current Location"
        type="text"
        value={currentLocation}
        onChange={(e) => setCurrentLocation(e.target.value)}
      />
      <TextFieldWrapper
        label="Type"
        type="text"
        value={type}
        onChange={(e) => setType(e.target.value)}
      />
      <TextFieldWrapper
        label="Parent"
        type="text"
        value={parent}
        onChange={(e) => setParent(e.target.value)}
      />
      <TextFieldWrapper
        label="Status"
        type="text"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      />
      <TextFieldWrapper
        label="Profit"
        type="number"
        value={profit !== undefined ? profit.toString() : ''}
        onChange={(e) => {
          const value = e.target.value;
          const newProfit = value !== '' ? Number(value) : 0;
          setProfit(newProfit);
        }}
      />
      <TextFieldWrapper
        label="Start Date"
        type="date"
        value={startDate ? startDate.toISOString().split('T')[0] : ''}
        onChange={(e) => setStartDate(new Date(e.target.value))}
      />
      <TextFieldWrapper
        label="End Date"
        type="date"
        value={endDate ? endDate.toISOString().split('T')[0] : ''}
        onChange={(e) => setEndDate(new Date(e.target.value))}
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
