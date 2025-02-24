import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { databases } from "../../appwrite.js";
import { Permission, Role } from "appwrite";

const dbId = import.meta.env.VITE_DB_ID;
const usersCollId = import.meta.env.VITE_USERS_COLL_ID;
const adminTeamId = import.meta.env.VITE_ADMINS_TEAM_ID;

// Intitial State
const initialState = {
  isUserLoading: false,
  userProfile: null,
  usersList: null,
  errMsg: null,
};

// createUser
export const createUser = createAsyncThunk(
  "user/createUser",
  async (data, thunkAPI) => {
    console.log(data);
    const { docID, userName, userPhone, userCompany } = data;

    // create a permission so that only the admin can createUser
    const permissions = [
      Permission.read(Role.team(adminTeamId)),
      Permission.update(Role.team(adminTeamId)),
      Permission.delete(Role.team(adminTeamId)),
    ];

    try {
      const resp = await databases.createDocument(
        dbId,
        usersCollId,
        docID,
        {
          userName,
          userPhone,
          userCompany,
        },
        permissions
      );

      return resp;
    } catch (error) {
      console.log(error);
      return thunkAPI.rejectWithValue(error);
    }
  }
);

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
      })
      .addCase(createUser.pending, (state) => {
        state.isUserLoading = true;
        state.errMsg = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.isUserLoading = false;
        console.log("created user successfully...");
        console.log(action.payload);
      })
      .addCase(createUser.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        console.log("error in user/createUser");
        alert(payload.response.message);
        state.errMsg = payload.response.message || "could not create a user";
      });
  },
});

export default userSlice.reducer;
