import React, { useEffect, useState } from 'react';
import axiosInstance from './axiosInstance'; // Import the Axios instance

// Define the Expense type to match the structure of your expenses
interface Expense {
  _id: string;
  description: string;
  amount: number;
  // Add other fields as needed
}

const ExpenseList: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    // Fetch expenses from the API when the component mounts
    const fetchExpenses = async () => {
      try {
        const response = await axiosInstance.get('/api/expenses');
        setExpenses(response.data);
      } catch (error) {
        console.error('Error fetching expenses:', error);
        // Handle errors or show a message to the user.
      }
    };

    fetchExpenses();
  }, []);

  return (
    <div>
      <h2>Expense List</h2>
      <ul>
        {expenses.map((expense) => (
          <li key={expense._id}>{expense.description}: ${expense.amount}</li>
        ))}
      </ul>
    </div>
  );
}

export default ExpenseList;
