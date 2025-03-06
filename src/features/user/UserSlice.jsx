import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { databases } from "../../appwrite.js";
import { Permission, Role } from "appwrite";
import { updateBike } from "../bike/bikeSlice.js";

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

// assign bike to user (accepts id, userStatus and bikeId)
export const assignBikeToUser = createAsyncThunk(
  "user/assignBikeToUser",
  async (data, thunkAPI) => {
    console.log("data in assignBikeToUser");
    console.log(data);
    try {
      const response = await databases.updateDocument(
        dbId,
        usersCollId,
        data.userId,
        {
          userStatus: data.userStatus,
          bikeId: data.selectedBikeId,
        }
      );

      // update the bike status and details after assigning it to the user
      if (response) {
        // update the bike details
        await thunkAPI
          .dispatch(
            updateBike({
              bikeId: data.selectedBikeId,
              userId: data.userId,
              bikeStatus: data.bikeStatus,
            })
          )
          .unwrap();

        // get the updated usersList, (only after updateBike)
        thunkAPI.dispatch(getUsersList());
      }

      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// return bike from user
export const returnBikeFrmUser = createAsyncThunk(
  "user/returnBikeFrmUser",
  async ({ userId, bikeId }, thunkAPI) => {
    try {
      const response = await databases.updateDocument(
        dbId,
        usersCollId,
        userId,
        {
          userStatus: false,
          bikeId: null,
        }
      );

      // update the bike status and details after assigning it to the user
      if (response) {
        await thunkAPI
          .dispatch(
            updateBike({
              bikeId,
              userId,
              bikeStatus: false,
            })
          )
          .unwrap();
      }

      thunkAPI.dispatch(getUsersList());
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
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
      })
      .addCase(assignBikeToUser.pending, (state) => {
        state.isUserLoading = true;
        state.errMsg = null;
      })
      .addCase(assignBikeToUser.fulfilled, (state, action) => {
        state.isUserLoading = false;
        alert("Assigned bike successfully...");
        console.log(action.payload);
      })
      .addCase(assignBikeToUser.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        console.log("error in user/assignBikeToUser");
        alert(payload.response.message);
        console.log(payload);
        state.errMsg = payload.response.message || "could not assign a bike";
      })
      .addCase(returnBikeFrmUser.pending, (state) => {
        state.isUserLoading = true;
        state.errMsg = null;
      })
      .addCase(returnBikeFrmUser.fulfilled, (state, action) => {
        state.isUserLoading = false;
        alert("returned bike from the user successfully...");
        console.log(action.payload);
      })
      .addCase(returnBikeFrmUser.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        console.log("error in user/returnBikeFrmUser");
        alert(payload.response.message);
        console.log(payload);
        state.errMsg =
          payload.response.message || "could not return bike from user";
      });
  },
});

export default userSlice.reducer;
