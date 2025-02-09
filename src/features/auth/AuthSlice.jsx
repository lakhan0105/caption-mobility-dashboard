import { createSlice } from "@reduxjs/toolkit";

// initialState
const initialState = {
  currUser: null,
  isLoading: false,
  isSignup: false,
};

// authslice
const AuthSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setIsSignup(state, action) {
      state.isSignup = action.payload;
    },
  },
});

export const { setIsSignup } = AuthSlice.actions;
export default AuthSlice.reducer;
