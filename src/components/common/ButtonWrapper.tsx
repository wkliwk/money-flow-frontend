import React from 'react';
import Button from '@mui/material/Button';

interface ButtonWrapperProps {
  label: string;
  onClick: () => void;
}

const ButtonWrapper: React.FC<ButtonWrapperProps> = ({ label, onClick }) => {
  return (
    <Button variant="contained" color="primary" onClick={onClick}>
      {label}
    </Button>
  );
};

export default ButtonWrapper;
