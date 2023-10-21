import React, { useEffect, useState } from 'react';
import { getExpenses } from '../services/api'; // Import the API service
import { ExpenseResponse } from '../types'; // Import the API service
import TableWrapper from './common/TableWrapper';

const ExpenseList: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await getExpenses();
        setExpenses(response);
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
      <TableWrapper data={expenses} />
    </div>
  );
}

export default ExpenseList;
