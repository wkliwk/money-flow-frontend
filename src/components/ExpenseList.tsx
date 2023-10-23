import React, { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { getExpenses, createExpense } from '../services/api'; // Import API functions
import { ExpenseResponse } from '../types';
import TableWrapper from './common/TableWrapper';
import AddExpenseForm from './AddExpenseForm';


const ExpenseList: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);
  const [addExpenseFormOpen, setAddExpenseFormOpen] = useState(false);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response: ExpenseResponse[] = await getExpenses();
  
        const expensesWithDate: ExpenseResponse[] = response.map((expense: ExpenseResponse) => ({
          ...expense,
          startDate: expense.startDate ? new Date(expense.startDate) : null, // Use null for undefined dates
          endDate: expense.endDate ? new Date(expense.endDate) : null, // Use null for undefined dates
        }));
  
        setExpenses(expensesWithDate);
      } catch (error) {
        console.error('Error fetching expenses:', error);
        // Handle errors or show a message to the user.
      }
    };
  
    fetchExpenses();
  }, []);
  

  const handleAddExpense = (newExpense: ExpenseResponse) => {
    // Add the new expense to the list
    setExpenses([...expenses, newExpense]);
  };

  
  return (
    <div>
      <h2>Expense List</h2>
      <Button onClick={() => setAddExpenseFormOpen(true)}>Add Expense</Button>
      <TableWrapper data={expenses} />

      {/* Add Expense Form */}
      <AddExpenseForm
        open={addExpenseFormOpen}
        onClose={() => setAddExpenseFormOpen(false)}
        onAddExpense={handleAddExpense}
      />
    </div>
  );
};
export default ExpenseList;
