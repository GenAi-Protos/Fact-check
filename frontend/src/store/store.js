// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import factCheckerReducer from '../slice/factCheckerSlice';

export const store = configureStore({
  reducer: {
    factChecker: factCheckerReducer,
  },
});

export default store;