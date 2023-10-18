import React from 'react';
import { styled } from '@mui/system'; // Import 'styled' from @mui/system

const RootContainer = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  });
  
const ExpenseList: React.FC = () => {
    return (
      <RootContainer>
        <h2>Expense List</h2>
        {/* List expenses here */}
      </RootContainer>
    );
  }

export default ExpenseList;
