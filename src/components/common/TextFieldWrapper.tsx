import React from 'react';
import TextField from '@mui/material/TextField';

interface TextFieldWrapperProps {
  label: string;
  type: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const TextFieldWrapper: React.FC<TextFieldWrapperProps> = ({ label, type, value, onChange }) => {
  return <TextField label={label} type={type} value={value} onChange={onChange} />;
};

export default TextFieldWrapper;
