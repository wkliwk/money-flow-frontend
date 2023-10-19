import axios from 'axios';

const baseURL = 'http://localhost:3001'; // Set your backend domain here

const axiosInstance = axios.create({
  baseURL,
  timeout: 10000, // Set your preferred timeout
  headers: {
    'Content-Type': 'application/json', // Set your preferred content type
    // Add any other common headers here
  },
});

export default axiosInstance;
