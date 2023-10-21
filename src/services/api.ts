import axiosInstance from '../axiosInstance';
import { ExpenseRequest } from '../types'; // Import the API service

export const createExpense = async (expenseData: ExpenseRequest) => {
    try {
        // Omit the _id field, and MongoDB will generate it
        const response = await axiosInstance.post('/api/expenses', expenseData);
        return response.data;
      } catch (error) {
        throw error;
      }
  };
  
  export const getExpenses = async () => {
    try {
      const response = await axiosInstance.get('/api/expenses');
      return response.data;
    } catch (error) {
      throw error;
    }
  };
  
  export const updateExpense = async (id: string, data: ExpenseRequest) => {
    try {
      const response = await axiosInstance.put(`/api/expenses/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };
  
  export const deleteExpense = async (id: string) => {
    try {
      const response = await axiosInstance.delete(`/api/expenses/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  };
  