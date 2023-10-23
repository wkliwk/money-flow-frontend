import React from 'react';
import { styled } from '@mui/system';

const RootContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

const EditExpense: React.FC = () => {
  return (
    <RootContainer>
      <h2>Edit Expense</h2>
      {/* Edit expense details here */}
    </RootContainer>
  );
};

export default EditExpense;
