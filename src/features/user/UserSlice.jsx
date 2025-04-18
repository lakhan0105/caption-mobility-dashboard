import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { databases } from "../../appwrite.js";
import { Permission, Query, Role } from "appwrite";
import { updateBike } from "../bike/bikeSlice.js";
import { updateBattery } from "../battery/batterySlice.js";
import toast from "react-hot-toast";

const dbId = import.meta.env.VITE_DB_ID;
const usersCollId = import.meta.env.VITE_USERS_COLL_ID;
const adminTeamId = import.meta.env.VITE_ADMINS_TEAM_ID;

// Intitial State
const initialState = {
  isUserLoading: false,
  userProfile: null,
  usersList: [],
  usersListCount: 0,
  errMsg: null,
  activeUsers: null,
  isEditUser: false,
  selectedUser: null,
};

// createUser
export const createUser = createAsyncThunk(
  "user/createUser",
  async (data, thunkAPI) => {
    console.log(data);
    const {
      docID,
      userName,
      userRegisterId,
      userPhone,
      userCompany,
      userLocation,
    } = data;

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
          userRegisterId,
          userPhone,
          userCompany,
          userLocation,
        },
        permissions
      );

      console.log(resp);

      return resp;
    } catch (error) {
      console.log(error.response.data);
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// editUser
export const editUser = createAsyncThunk(
  "user/editUser",
  async (data, thunkAPI) => {
    const {
      userId,
      userName,
      userRegisterId,
      userPhone,
      userCompany,
      userLocation,
    } = data;

    try {
      const resp = await databases.updateDocument(dbId, usersCollId, userId, {
        userName,
        userRegisterId,
        userPhone,
        userCompany,
        userLocation,
      });
      return resp;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// toggleUserBlock
// - accepts a userId, isBlocked and userNotes(if he is going to get blocked)
// - if isBlocked === true -> unblock the user
// - if isBlocked === false -> block the user
export const toggleUserBlock = createAsyncThunk(
  "toggleUserBlock",
  async ({ userId, isBlocked, userNotes }, thunkAPI) => {
    try {
      const resp = await databases.updateDocument(dbId, usersCollId, userId, {
        isBlocked,
        userNotes: isBlocked ? userNotes : null,
      });

      return resp;
    } catch (error) {
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
  async (offset, thunkAPI) => {
    const limit = 20;
    try {
      const response = await databases.listDocuments(dbId, usersCollId, [
        Query.limit(limit),
        Query.offset(offset),
      ]);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// get getUserBySearch
export const getUserBySearch = createAsyncThunk(
  "user/getUserBySearch",
  async (inputText, thunkAPI) => {
    try {
      const resp = await databases.listDocuments(dbId, usersCollId, [
        Query.contains("userName", inputText),
      ]);
      console.log(resp);
      return resp;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// get user by filter (rusn when the filter btns are clicked)
export const getUserByFilter = createAsyncThunk(
  "user/getUserByFilter",
  async ({ attributeName, attributeValue }, thunkAPI) => {
    console.log(attributeName, attributeValue);

    let query;
    if (attributeName === "userStatus") {
      query = [Query.equal(`${attributeName}`, true)];
    } else if (attributeName === "pendingAmount") {
      query = [Query.greaterThan("pendingAmount", 0)];
    } else if (attributeName === "userCompany") {
      query = [Query.contains("userCompany", attributeValue)];
    }

    try {
      const resp = await databases.listDocuments(dbId, usersCollId, query);
      console.log(resp);
      return resp;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// assign bike to user (accepts id, userStatus and bikeId)
export const assignBikeToUser = createAsyncThunk(
  "user/assignBikeToUser",
  async (
    {
      selectedBikeId,
      selectedBatteryId,
      userId,
      pendingAmount,
      paidAmount,
      depositAmount,
      chargerStatus,
    },
    thunkAPI
  ) => {
    try {
      // update the user details
      const response = await databases.updateDocument(
        dbId,
        usersCollId,
        userId,
        {
          userStatus: true,
          bikeId: selectedBikeId,
          batteryId: selectedBatteryId,
          totalSwapCount: 0,
          pendingAmount: Number(pendingAmount),
          depositAmount: Number(depositAmount),
          paidAmount: Number(paidAmount),
          chargerStatus,
        }
      );

      // update the bike status and details after assigning it to the user
      if (response) {
        // update the bike details
        await thunkAPI
          .dispatch(
            updateBike({
              bikeId: selectedBikeId,
              userId: userId,
              bikeStatus: true,
            })
          )
          .unwrap()
          .then(async () => {
            await thunkAPI.dispatch(
              updateBattery({
                batteryId: selectedBatteryId,
                userId,
                batStatus: true,
                assignedAt: new Date(),
              })
            );
          });

        // get the updated usersList, (only after updateBike)
        thunkAPI.dispatch(getUsersList());
      }

      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// updateUserBattery
// - this will update the battery of the user on swap
export const updateUserBattery = createAsyncThunk(
  "user/updateUserBattery",
  async (data, thunkAPI) => {
    const { userId, oldBatteryId, newBatteryId, totalSwapCount } = data;

    try {
      const response = await databases.updateDocument(
        dbId, // database id
        usersCollId, // collection id
        userId, // doc id
        {
          oldBatteryId,
          batteryId: newBatteryId,
          totalSwapCount,
        }
      );
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// getActiveUsers
export const getActiveUsers = createAsyncThunk(
  "user/getActiveUsers",
  async (_, thunkAPI) => {
    try {
      const resp = await databases.listDocuments(dbId, usersCollId, [
        Query.equal("userStatus", [true]),
      ]);
      console.log(resp);
      return resp.documents;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// getUserByBatteryId
// export const getUserByBattery = createAsyncThunk(
//   "user/getUserByBattery",
//   async (batteryId, thunkAPI) => {
//     try {
//       const resp = await databases.listDocuments(dbId, usersCollId, [
//         Query.equal("batteryId", batteryId),
//       ]);
//       return resp;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error);
//     }
//   }
// );

// return bike from user
export const returnBikeFrmUser = createAsyncThunk(
  "user/returnBikeFrmUser",
  async ({ userId, bikeId, batteryId, totalSwapCount }, thunkAPI) => {
    try {
      const response = await databases.updateDocument(
        dbId,
        usersCollId,
        userId,
        {
          userStatus: false,
          bikeId: null,
          batteryId: null,
          totalSwapCount,
        }
      );

      // update the bike status and details after assigning it to the user
      if (response) {
        await thunkAPI
          .dispatch(
            updateBike({
              bikeId,
              userId: null,
              bikeStatus: false,
            })
          )
          .unwrap()
          .then(async () => {
            thunkAPI.dispatch(
              updateBattery({
                batteryId,
                userId: null,
                batStatus: false,
                assignedAt: null,
                returnedAt: new Date(),
              })
            );
          });
      }

      thunkAPI.dispatch(getUsersList());
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// updatePendingAmount
export const updatePayment = createAsyncThunk(
  "user/updatePayment",
  async ({ userId, data }, thunkAPI) => {
    console.log(data);
    try {
      const resp = await databases.updateDocument(dbId, usersCollId, userId, {
        ...data,
      });
      return resp;
    } catch (error) {
      console.log(error);
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// deleteUser
export const deleteUser = createAsyncThunk(
  "user/deleteUser",
  async (userId, thunkAPI) => {
    try {
      const resp = await databases.deleteDocument(dbId, usersCollId, userId);
      return resp;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setEditUser(state, { payload }) {
      state.isEditUser = payload;
    },
    setSelectedUser(state, { payload }) {
      console.log("running setSelectedUser");
      console.log(payload);
      state.selectedUser = payload;
    },
  },
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
        console.log(action.payload);
        const { total, documents } = action.payload;

        console.log(documents);

        if (action.meta.arg === 0) {
          state.usersList = documents;
        } else {
          state.usersList = [...state.usersList, ...documents];
        }

        state.usersListCount = total;
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

        if (payload.code === 409) {
          toast.error("user with same name/registerId already present!");
        }

        state.errMsg = payload.response.message || "could not create a user";
      })
      .addCase(assignBikeToUser.pending, (state) => {
        state.isUserLoading = true;
        state.errMsg = null;
      })
      .addCase(assignBikeToUser.fulfilled, (state, action) => {
        state.isUserLoading = false;
        toast.success("Assigned bike successfully...");
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
        toast.success("returned bike from the user successfully...");
        console.log(action.payload);
      })
      .addCase(returnBikeFrmUser.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        toast.error("error in user/returnBikeFrmUser");
        console.log(payload);
      })
      .addCase(updateUserBattery.pending, (state) => {
        state.isUserLoading = true;
        state.errMsg = null;
      })
      .addCase(updateUserBattery.fulfilled, (state, action) => {
        state.isUserLoading = false;
        console.log("updated battery details of the user successfully...");
        console.log(action.payload);
      })
      .addCase(updateUserBattery.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        console.log("error in user/updateUserBattery");
        console.log(payload);
      })
      .addCase(getActiveUsers.pending, (state) => {
        state.isUserLoading = true;
        state.errMsg = null;
      })
      .addCase(getActiveUsers.fulfilled, (state, action) => {
        state.isUserLoading = false;
        console.log("found active users");
        state.activeUsers = action.payload;
      })
      .addCase(getActiveUsers.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        console.log("error in user/getActiveUsers");
        console.log(payload);
      })
      .addCase(updatePayment.pending, (state) => {
        state.isUserLoading = true;
        state.errMsg = null;
      })
      .addCase(updatePayment.fulfilled, (state, action) => {
        state.isUserLoading = false;
        console.log("updated the payment details of the user");
        toast.success("updated the pending amount details");
      })
      .addCase(updatePayment.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        console.log("error in user/updatePayment");
        console.log(payload);
      })
      .addCase(getUserBySearch.pending, (state) => {
        state.isUserLoading = true;
        state.errMsg = null;
      })
      .addCase(getUserBySearch.fulfilled, (state, action) => {
        state.isUserLoading = false;
        state.usersList = action.payload.documents;
      })
      .addCase(getUserBySearch.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        console.log("error in user/getUserBySearch");
        console.log(payload);
      })
      .addCase(getUserByFilter.pending, (state) => {
        state.isUserLoading = true;
        state.errMsg = null;
      })
      .addCase(getUserByFilter.fulfilled, (state, action) => {
        state.isUserLoading = false;
        state.usersList = action.payload.documents;
      })
      .addCase(getUserByFilter.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        console.log("error in user/getUserBySearch");
        console.log(payload);
      })
      .addCase(deleteUser.pending, (state) => {
        state.isUserLoading = true;
      })
      .addCase(deleteUser.fulfilled, (state) => {
        state.isUserLoading = false;
        toast.success("deleted the user successfully!");
      })
      .addCase(deleteUser.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        console.log("error in user/deleteUser");
        console.log(payload);
      })
      .addCase(editUser.pending, (state) => {
        state.isUserLoading = true;
      })
      .addCase(editUser.fulfilled, (state) => {
        state.isUserLoading = false;
        toast.success("updated the user details successfully!");
      })
      .addCase(editUser.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        console.log("error in user/editUser");
        console.log(payload);
      })
      .addCase(toggleUserBlock.pending, (state) => {
        state.isUserLoading = true;
      })
      .addCase(toggleUserBlock.fulfilled, (state, { payload }) => {
        state.isUserLoading = false;
        console.log(payload.isBlocked);
        if (payload.isBlocked) {
          toast.success("blocked the user successfully!");
        } else {
          toast.success("unblocked the user successfully!");
        }
      })
      .addCase(toggleUserBlock.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        console.log("error in user/toggleUserBlock");
        console.log(payload);
      });
    // .addCase(getUserByBattery.pending, (state) => {
    //   state.isUserLoading = true;
    // })
    // .addCase(getUserByBattery.fulfilled, (state, { payload }) => {
    //   state.isUserLoading = false;
    //   console.log(payload);
    //   state.selectedUser = payload.documents[0];
    //   console.log(state.selectedUser);
    // })
    // .addCase(getUserByBattery.rejected, (state, { payload }) => {
    //   state.isUserLoading = false;
    //   console.log("error in user/getUserByBattery");
    //   console.log(payload);
    // });
  },
});

export const { setEditUser, setSelectedUser } = userSlice.actions;
export default userSlice.reducer;
