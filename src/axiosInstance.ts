import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3001', // Set your backend domain here
});

export default instance;
