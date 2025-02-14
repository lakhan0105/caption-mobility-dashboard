import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { databases } from "../../appwrite.js";
const dbId = import.meta.env.VITE_DB_ID;
const usersCollId = import.meta.env.VITE_USERS_COLL_ID;

// Intitial State
const initialState = {
  isUserLoading: false,
  userProfile: null,
  errMsg: null,
};

// getUserProfile
export const getUserProfile = createAsyncThunk(
  "user/getUserProfile",
  async (id, thunkAPI) => {
    try {
      const response = await databases.getDocument(dbId, usersCollId, id);

      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue("Error in user/getUserProfile", error);
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(getUserProfile.pending, (state) => {
        state.isUserLoading = true;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.isUserLoading = false;
        console.log("fetched the user profile successfully...");
        console.log(action.payload);
        state.userProfile = action.payload;
      })
      .addCase(getUserProfile.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        console.log(payload);
        state.errMsg = payload || "User profile not found";
      });
  },
});

export default userSlice.reducer;
