import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { databases } from "../../appwrite.js";
const dbId = import.meta.env.VITE_DB_ID;
const usersCollId = import.meta.env.VITE_USERS_COLL_ID;

// Intitial State
const initialState = {
  isUserLoading: false,
  userProfile: null,
  usersList: null,
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

// get users list
export const getUsersList = createAsyncThunk(
  "user/getUsersList",
  async (_, thunkAPI) => {
    try {
      const response = await databases.listDocuments(dbId, usersCollId);
      console.log(response);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue("error in user/getUsersList", error);
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
      })
      .addCase(getUsersList.pending, (state) => {
        state.isUserLoading = true;
      })
      .addCase(getUsersList.fulfilled, (state, action) => {
        state.isUserLoading = false;
        console.log("fetched the users List successfully...");
        console.log(action.payload);
        const { total, documents } = action.payload;
        state.usersList = documents;
      })
      .addCase(getUsersList.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        console.log(payload);
        state.errMsg = payload || "Users list not found";
      });
  },
});

export default userSlice.reducer;
