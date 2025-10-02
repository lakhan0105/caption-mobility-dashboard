import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { databases } from "../../appwrite.js";
import { ID, Permission, Query, Role } from "appwrite";
import { updateBike } from "../bike/bikeSlice.js";
import { updateBattery } from "../battery/batterySlice.js";
import toast from "react-hot-toast";

const dbId = import.meta.env.VITE_DB_ID;
const usersCollId = import.meta.env.VITE_USERS_COLL_ID;
const adminTeamId = import.meta.env.VITE_ADMINS_TEAM_ID;
const bikesCollId = import.meta.env.VITE_BIKES_COLL_ID;
const companyCollId = import.meta.env.VITE_COMPANY_COLL_ID;

const initialState = {
  isUserLoading: false,
  userProfile: null,
  usersList: [],
  usersListCount: 0,
  errMsg: null,
  activeUsers: null,
  isEditUser: false,
  selectedUser: null,
  activeFilter: null,
};

export const createUser = createAsyncThunk(
  "user/createUser",
  async (data, thunkAPI) => {
    const {
      docID,
      userName,
      userRegisterId,
      userPhone,
      userCompany,
      userLocation,
      userPhotoId,
    } = data;
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
          userCompany: userCompany
            ? userCompany.trim().toLowerCase()
            : userCompany,
          userLocation,
          userPhotoId,
          userStatus: false,
          depositAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
        },
        permissions
      );
      return resp;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

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
        userCompany: userCompany
          ? userCompany.trim().toLowerCase()
          : userCompany,
        userLocation,
      });
      return resp;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

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

export const getUserProfile = createAsyncThunk(
  "user/getUserProfile",
  async (id, thunkAPI) => {
    try {
      const response = await databases.getDocument(dbId, usersCollId, id);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

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

export const getUserBySearch = createAsyncThunk(
  "user/getUserBySearch",
  async ({ inputText, offset = 0 }, thunkAPI) => {
    const limit = 20;
    try {
      const resp = await databases.listDocuments(dbId, usersCollId, [
        Query.contains("userName", inputText),
        Query.limit(limit),
        Query.offset(offset),
      ]);
      return resp;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getUserByFilter = createAsyncThunk(
  "user/getUserByFilter",
  async ({ attributeName, attributeValue, offset = 0 }, thunkAPI) => {
    const limit = 20;
    let query;
    if (attributeName === "userStatus") {
      query = [
        Query.equal("userStatus", true),
        Query.limit(limit),
        Query.offset(offset),
      ];
    } else if (attributeName === "pendingAmount") {
      query = [
        Query.greaterThan("pendingAmount", 0),
        Query.limit(limit),
        Query.offset(offset),
      ];
    } else if (attributeName === "userCompany") {
      query = [
        Query.contains("userCompany", attributeValue),
        Query.limit(limit),
        Query.offset(offset),
      ];
    }
    try {
      const resp = await databases.listDocuments(dbId, usersCollId, query);
      console.log("Filtered users:", resp);
      return resp;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

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
      const currentPending =
        (await databases.getDocument(dbId, usersCollId, userId))
          .pendingAmount || 0;
      const newPending = currentPending + Number(pendingAmount);
      const response = await databases.updateDocument(
        dbId,
        usersCollId,
        userId,
        {
          userStatus: true,
          bikeId: selectedBikeId,
          batteryId: selectedBatteryId,
          totalSwapCount: 0,
          depositAmount: Number(depositAmount),
          paidAmount: Number(paidAmount),
          pendingAmount: newPending,
          chargerStatus,
        }
      );

      if (response) {
        await thunkAPI
          .dispatch(
            updateBike({ bikeId: selectedBikeId, userId, bikeStatus: true })
          )
          .unwrap();
        await thunkAPI.dispatch(
          updateBattery({
            batteryId: selectedBatteryId,
            userId,
            batStatus: true,
            assignedAt: new Date(),
          })
        );
      }

      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const updateUserBattery = createAsyncThunk(
  "user/updateUserBattery",
  async (data, thunkAPI) => {
    const { userId, oldBatteryId, newBatteryId, totalSwapCount } = data;
    try {
      await databases.updateDocument(dbId, usersCollId, userId, {
        oldBatteryId,
        batteryId: newBatteryId,
        totalSwapCount,
      });
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getActiveUsers = createAsyncThunk(
  "user/getActiveUsers",
  async (_, thunkAPI) => {
    try {
      const resp = await databases.listDocuments(dbId, usersCollId, [
        Query.equal("userStatus", [true]),
      ]);
      return resp.documents;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const returnBikeFromUser = createAsyncThunk(
  "user/returnBikeFromUser",
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
      if (response) {
        await thunkAPI
          .dispatch(
            updateBike({
              bikeId,
              userId: null,
              bikeStatus: false,
              returnedAt: new Date().toISOString(),
            })
          )
          .unwrap();
        await thunkAPI.dispatch(
          updateBattery({
            batteryId,
            userId: null,
            batStatus: false,
            assignedAt: null,
            returnedAt: new Date().toISOString(),
          })
        );
      }
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const updatePayment = createAsyncThunk(
  "user/updatePayment",
  async ({ userId, pendingAmount }, thunkAPI) => {
    try {
      const resp = await databases.updateDocument(dbId, usersCollId, userId, {
        pendingAmount: Number(pendingAmount),
      });
      return resp;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const deleteUser = createAsyncThunk(
  "user/deleteUser",
  async (userId, thunkAPI) => {
    try {
      await databases.deleteDocument(dbId, usersCollId, userId);
      return userId;
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
      state.selectedUser = payload;
    },
    setActiveFilter(state, { payload }) {
      state.activeFilter = payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getUserProfile.pending, (state) => {
        state.isUserLoading = true;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.isUserLoading = false;
        state.userProfile = action.payload;
      })
      .addCase(getUserProfile.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        state.errMsg = payload?.message || "User profile not found";
      })
      .addCase(getUsersList.pending, (state) => {
        state.isUserLoading = true;
        state.errMsg = null;
      })
      .addCase(getUsersList.fulfilled, (state, { payload, meta }) => {
        state.isUserLoading = false;
        const { total, documents } = payload;
        if (meta.arg === 0) {
          state.usersList = documents;
        } else {
          state.usersList = [...state.usersList, ...documents];
        }
        state.usersListCount = total;
        state.activeFilter = null;
        state.errMsg =
          documents.length === 0 && meta.arg === 0 ? "No users found" : null;
      })
      .addCase(getUsersList.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        state.errMsg = payload?.message || "Users list not found";
      })
      .addCase(createUser.pending, (state) => {
        state.isUserLoading = true;
        state.errMsg = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.isUserLoading = false;
        state.usersList = [action.payload, ...state.usersList];
        state.usersListCount += 1;
        toast.success("Created user successfully!");
      })
      .addCase(createUser.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        if (payload.code === 409) {
          toast.error("User with same name/registerId already present!");
        }
        state.errMsg = payload?.message || "Could not create a user";
      })
      .addCase(assignBikeToUser.pending, (state) => {
        state.isUserLoading = true;
        state.errMsg = null;
      })
      .addCase(assignBikeToUser.fulfilled, (state, action) => {
        state.isUserLoading = false;
        toast.success("Assigned bike successfully!");
      })
      .addCase(assignBikeToUser.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        toast.error(payload?.message || "Could not assign a bike");
        state.errMsg = payload?.message || "Could not assign a bike";
      })
      .addCase(returnBikeFromUser.pending, (state) => {
        state.isUserLoading = true;
        state.errMsg = null;
      })
      .addCase(returnBikeFromUser.fulfilled, (state, action) => {
        state.isUserLoading = false;
        toast.success("Returned bike from the user successfully!");
      })
      .addCase(returnBikeFromUser.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        toast.error(payload?.message || "Error in user/returnBikeFromUser");
        state.errMsg = payload?.message || "Error in user/returnBikeFromUser";
      })
      .addCase(updateUserBattery.pending, (state) => {
        state.isUserLoading = true;
        state.errMsg = null;
      })
      .addCase(updateUserBattery.fulfilled, (state) => {
        state.isUserLoading = false;
        toast.success("Updated battery details successfully!");
      })
      .addCase(updateUserBattery.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        toast.error(payload?.message || "Error in user/updateUserBattery");
      })
      .addCase(getActiveUsers.pending, (state) => {
        state.isUserLoading = true;
        state.errMsg = null;
      })
      .addCase(getActiveUsers.fulfilled, (state, action) => {
        state.isUserLoading = false;
        state.activeUsers = action.payload;
      })
      .addCase(getActiveUsers.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        toast.error(payload?.message || "Error in user/getActiveUsers");
      })
      .addCase(updatePayment.pending, (state) => {
        state.isUserLoading = true;
        state.errMsg = null;
      })
      .addCase(updatePayment.fulfilled, (state) => {
        state.isUserLoading = false;
        toast.success("Updated payment details successfully!");
      })
      .addCase(updatePayment.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        toast.error(payload?.message || "Error in user/updatePayment");
      })
      .addCase(getUserBySearch.pending, (state) => {
        state.isUserLoading = true;
        state.errMsg = null;
      })
      .addCase(getUserBySearch.fulfilled, (state, { payload, meta }) => {
        state.isUserLoading = false;
        if (meta.arg.offset === 0) {
          state.usersList = payload.documents;
        } else {
          state.usersList = [...state.usersList, ...payload.documents];
        }
        state.usersListCount = payload.total;
        state.activeFilter = null;
        state.errMsg =
          payload.documents.length === 0 && meta.arg.offset === 0
            ? "No users found"
            : null;
      })
      .addCase(getUserBySearch.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        toast.error(payload?.message || "Error in user/getUserBySearch");
        state.errMsg = payload?.message || "Error in user/getUserBySearch";
      })
      .addCase(getUserByFilter.pending, (state) => {
        state.isUserLoading = true;
        state.errMsg = null;
      })
      .addCase(getUserByFilter.fulfilled, (state, { payload, meta }) => {
        state.isUserLoading = false;
        if (meta.arg.offset === 0) {
          state.usersList = payload.documents;
        } else {
          state.usersList = [...state.usersList, ...payload.documents];
        }
        state.usersListCount = payload.total;
        state.errMsg =
          payload.documents.length === 0 && meta.arg.offset === 0
            ? "No users available"
            : null;
      })
      .addCase(getUserByFilter.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        toast.error(payload?.message || "Error in user/getUserByFilter");
        state.errMsg = payload?.message || "Error in user/getUserByFilter";
      })
      .addCase(deleteUser.pending, (state) => {
        state.isUserLoading = true;
      })
      .addCase(deleteUser.fulfilled, (state, { payload }) => {
        state.isUserLoading = false;
        state.usersList = state.usersList.filter(
          (user) => user.$id !== payload
        );
        state.usersListCount -= 1;
        toast.success("Deleted the user successfully!");
      })
      .addCase(deleteUser.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        toast.error(payload?.message || "Error in user/deleteUser");
        state.errMsg = payload?.message || "Error in user/deleteUser";
      })
      .addCase(editUser.pending, (state) => {
        state.isUserLoading = true;
      })
      .addCase(editUser.fulfilled, (state) => {
        state.isUserLoading = false;
        toast.success("Updated the user details successfully!");
      })
      .addCase(editUser.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        toast.error(payload?.message || "Error in user/editUser");
        state.errMsg = payload?.message || "Error in user/editUser";
      })
      .addCase(toggleUserBlock.pending, (state) => {
        state.isUserLoading = true;
      })
      .addCase(toggleUserBlock.fulfilled, (state, { payload }) => {
        state.isUserLoading = false;
        toast.success(
          payload.isBlocked
            ? "Blocked the user successfully!"
            : "Unblocked the user successfully!"
        );
      })
      .addCase(toggleUserBlock.rejected, (state, { payload }) => {
        state.isUserLoading = false;
        toast.error(payload?.message || "Error in user/toggleUserBlock");
        state.errMsg = payload?.message || "Error in user/toggleUserBlock";
      });
  },
});

export const { setEditUser, setSelectedUser, setActiveFilter } =
  userSlice.actions;
export default userSlice.reducer;
