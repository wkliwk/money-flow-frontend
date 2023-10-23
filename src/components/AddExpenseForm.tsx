import React, { useState } from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
  } from '@mui/material';
  import { DatePicker } from '@mui/x-date-pickers/DatePicker';

  import { createExpense } from '../services/api'; // Import API functions

interface AddExpenseFormProps {
  open: boolean;
  onClose: () => void;
  onAddExpense: (newExpense: any) => void; // Define the type for new expenses
}

const AddExpenseForm: React.FC<AddExpenseFormProps> = ({ open, onClose, onAddExpense }) => {
    const [formData, setFormData] = useState({
        owner: '',
        description: '',
        purpose: '',
        currentLocation: '',
        type: '',
        parent: '',
        status: '',
        profit: 0, // Initialize with an appropriate default value
        startDate: null, // Initialize with null or an initial date value
        endDate: null, // Initialize with null or an initial date value
        amount: 0, // Initialize with an appropriate default value
      });
        
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    // Make an API call to create the new expense
    try {
      // Call your API to create the new expense, passing formData
      const newExpense = await createExpense(formData);

      // Add the new expense to the list
      onAddExpense(newExpense);
      onClose();
    } catch (error) {
      // Handle API call error
      console.error('Error creating expense:', error);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>

    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add Expense</DialogTitle>
      <DialogContent>
        <DialogContentText>
          To add a new expense, please fill in the details below.
        </DialogContentText>
        <TextField
          name="owner"
          label="Owner"
          value={formData.owner}
          onChange={handleChange}
          fullWidth
          style={{ margin: '8px 0' }}

        />
        <TextField
          name="description"
          label="Description"
          value={formData.description}
          onChange={handleChange}
          fullWidth
          style={{ margin: '8px 0' }}
        />
        <TextField
        name="purpose"
        label="Purpose"
        value={formData.purpose}
        onChange={handleChange}
        fullWidth
        style={{ margin: '8px 0' }}
        />

        <TextField
        name="currentLocation"
        label="Current Location"
        value={formData.currentLocation}
        onChange={handleChange}
        fullWidth
        style={{ margin: '8px 0' }}
        />

        <TextField
        name="type"
        label="Type"
        value={formData.type}
        onChange={handleChange}
        fullWidth
        style={{ margin: '8px 0' }}
        />

        <TextField
        name="parent"
        label="Parent"
        value={formData.parent}
        onChange={handleChange}
        fullWidth
        style={{ margin: '8px 0' }}
        />

        <TextField
        name="status"
        label="Status"
        value={formData.status}
        onChange={handleChange}
        fullWidth
        style={{ margin: '8px 0' }}
        />

        <TextField
        name="profit"
        label="Profit"
        type="number"
        value={formData.profit}
        onChange={handleChange}
        fullWidth
        style={{ margin: '8px 0' }}
        />

        {/* <DatePicker
        name="startDate"
        label="Start Date"
        type="date"
        value={formData.startDate}
        onChange={handleChange}
        fullWidth
        style={{ margin: '8px 0' }}
        />
 */}

        {/* <DatePicker
        name="endDate"
        label="End Date"
        type="date"
        value={formData.endDate}
        onChange={handleChange}
        fullWidth
        style={{ margin: '8px 0' }}
        /> */}
    <div style={{ margin: '8px 0' }}>
    <DatePicker
  label="Start Date"
  value={formData.startDate}
  onChange={(date) => setFormData({ ...formData, startDate: date !== "" ? new Date(date) : null })}
/>

<DatePicker
  label="End Date"
  value={formData.endDate ? new Date(formData.endDate) : null}
  onChange={(date) =>
    setFormData({
      ...formData,
      endDate: date ? date.toISOString() : null,
    })
  }
/>

With this code, if formData.startDate and formData.endDate are initially stored as ISO date strings, the DatePicker will work as expected and keep the Date objects as expected by the MUI library.








    </div>

        <TextField
        name="amount"
        label="Amount"
        type="number"
        value={formData.amount}
        onChange={handleChange}
        fullWidth
        style={{ margin: '8px 0' }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary">
          Add Expense
        </Button>
      </DialogActions>
    </Dialog>
    </LocalizationProvider>
  );
};

export default AddExpenseForm;