// src/features/factChecker/factCheckerSlice.js
import { createSlice } from '@reduxjs/toolkit';

const factCheckerSlice = createSlice({
  name: 'factChecker',
  initialState: {
    query: '',                    // Searched query
    accumulatedResponse: '',      // Accumulated response from API stream
    events: [],
    finalResult: null,
    sources: {},
    isLoading: false,
    error: null,
    showResults: false,
    isBrowsing: false,
    likedEvents: new Set(),
    eventStatuses: {},
  },
  reducers: {
    setQuery: (state, action) => {
      state.query = action.payload;
    },
    setAccumulatedResponse: (state, action) => {
      state.accumulatedResponse = action.payload;
    },
    setEvents: (state, action) => {
      state.events = action.payload;
    },
    setFinalResult: (state, action) => {
      state.finalResult = action.payload;
    },
    setSources: (state, action) => {
      state.sources = action.payload;
    },
    setIsLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setShowResults: (state, action) => {
      state.showResults = action.payload;
    },
    setIsBrowsing: (state, action) => {
      state.isBrowsing = action.payload;
    },
    setLikedEvents: (state, action) => {
      state.likedEvents = new Set(action.payload);
    },
    setEventStatuses: (state, action) => {
      state.eventStatuses = action.payload;
    },
  },
});

export const {
  setQuery,
  setAccumulatedResponse,
  setEvents,
  setFinalResult,
  setSources,
  setIsLoading,
  setError,
  setShowResults,
  setIsBrowsing,
  setLikedEvents,
  setEventStatuses,
} = factCheckerSlice.actions;

export default factCheckerSlice.reducer;