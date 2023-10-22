import React, { useEffect, useState } from 'react';
import { getExpenses } from '../services/api';
import { ExpenseResponse } from '../types';
import TableWrapper from './common/TableWrapper';

const ExpenseList: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response: ExpenseResponse[] = await getExpenses();
  
        // Convert startDate values to Date objects, handling undefined values
        const expensesWithDate: ExpenseResponse[] = response.map((expense: ExpenseResponse) => ({
          ...expense,
          startDate: expense.startDate ? new Date(expense.startDate) : undefined,
          endDate: expense.endDate ? new Date(expense.endDate) : undefined,
        }));
  
        setExpenses(expensesWithDate);
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
