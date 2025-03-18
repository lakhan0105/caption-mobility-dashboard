import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { databases } from "../../appwrite";
import { ID, Query } from "appwrite";
import { updateUserBattery } from "../user/UserSlice";
import toast from "react-hot-toast";
import { addRecord } from "../record/recordSlice";

const dbId = import.meta.env.VITE_DB_ID;
const batteriesCollId = import.meta.env.VITE_BATTERIES_COLL_ID;
const adminTeamId = import.meta.env.VITE_ADMINS_TEAM_ID;

const initialState = {
  isLoading: null,
  batteriesList: null,
  availableBatteries: null,
  batteryById: null,
  swapLoading: false,
};

// get all batteries list
export const getBatteriesList = createAsyncThunk(
  "battery/getBatteriesList",
  async (_, thunkAPI) => {
    try {
      const response = await databases.listDocuments(dbId, batteriesCollId);
      console.log(response);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getBatteryById = createAsyncThunk(
  "battery/getBatteryById",
  async (userBatteryId, thunkAPI) => {
    try {
      console.log("Fetching user battery details...");
      const response = await databases.getDocument(
        dbId,
        batteriesCollId,
        userBatteryId
      );
      return response;
    } catch (error) {
      console.error("Error while getting battery details:", error);
      return thunkAPI.rejectWithValue("Failed to fetch battery details");
    }
  }
);

// add new battery
export const addNewBattery = createAsyncThunk(
  "feat/addNewBattery",
  async (data, thunkAPI) => {
    try {
      const response = await databases.createDocument(
        dbId,
        batteriesCollId,
        ID.unique(),
        data
      );

      if (response) {
        alert("added new battery successfully!");
      }
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// available batteries
export const getAvailableBatteries = createAsyncThunk(
  "feat/getAvailableBatteries",
  async (_, thunkAPI) => {
    try {
      const resp = await databases.listDocuments(dbId, batteriesCollId, [
        Query.equal("batStatus", [false]),
      ]);
      console.log("available batteries ...");
      console.log(resp);

      return resp;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// update battery
export const updateBattery = createAsyncThunk(
  "feat/updateBattery",
  async (data, thunkAPI) => {
    console.log("data from updateBattery");
    console.log(data);
    try {
      const resp = await databases.updateDocument(
        dbId, // database id
        batteriesCollId, // collection id
        data.batteryId, // document id
        {
          currOwner: data.userId,
          batStatus: data.batStatus,
          assignedAt: data.assignedAt,
          returnedAt: data.returnedAt,
        }
      );

      return resp;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const swapBattery = createAsyncThunk(
  "user/swapBatteryToUser",
  async (data, thunkAPI) => {
    console.log("data in swap battery:", data);
    const {
      oldBatteryId,
      newBatteryId,
      userId,
      oldBatRegNum,
      newBatRegNum,
      totalSwapCount,
    } = data;

    try {
      // battery collection
      // return the old battery document
      // - change battery status to available
      // - remove the currOwner from old battery
      // - update the returnedAt attribute
      await thunkAPI
        .dispatch(
          updateBattery({
            batteryId: oldBatteryId,
            batStatus: false,
            userId: null,
            returnedAt: new Date(),
          })
        )
        .unwrap();

      // assign new battery
      // - change battery status to not available
      // - add the currOwner
      // - update the assignedAt
      await thunkAPI
        .dispatch(
          updateBattery({
            batteryId: newBatteryId,
            batStatus: true,
            userId,
            assignedAt: new Date(),
          })
        )
        .unwrap();

      // users collection
      // - update the prevBatteryId
      // - set the batteryId to new batteryId
      await thunkAPI
        .dispatch(
          updateUserBattery({
            userId,
            oldBatteryId,
            newBatteryId,
            totalSwapCount: totalSwapCount + 1,
          })
        )
        .unwrap();

      // add the record in the record collection
      // also increase the swap count here
      await thunkAPI.dispatch(
        addRecord({
          ...data,
          totalSwapCount: totalSwapCount + 1,
          swapDate: new Date(),
        })
      );

      return { success: true };
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

const batterySlice = createSlice({
  name: "batteryReducer",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(getBatteriesList.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(getBatteriesList.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.batteriesList = payload.documents;
      })
      .addCase(getBatteriesList.rejected, (state, { payload }) => {
        state.isLoading = false;
        alert("error in getBatteriesList");
        console.log(payload);
      })
      .addCase(getBatteryById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getBatteryById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.batteryById = action.payload;
      })
      .addCase(getBatteryById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(addNewBattery.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(addNewBattery.fulfilled, (state, { payload }) => {
        state.isLoading = false;
      })
      .addCase(addNewBattery.rejected, (state, { payload }) => {
        state.isLoading = false;
        alert("error in addNewBattery");
        console.log(payload);
      })
      .addCase(getAvailableBatteries.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(getAvailableBatteries.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.availableBatteries = payload.documents;
      })
      .addCase(getAvailableBatteries.rejected, (state, { payload }) => {
        state.isLoading = false;
        alert("error in getAvailableBatteries");
        console.log(payload);
      })
      .addCase(updateBattery.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(updateBattery.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        console.log("update Battery successfull...");
      })
      .addCase(updateBattery.rejected, (state, { payload }) => {
        state.isLoading = false;
        alert("error in updateBattery");
        console.log(payload);
      })
      .addCase(swapBattery.pending, (state, action) => {
        state.swapLoading = true;
      })
      .addCase(swapBattery.fulfilled, (state, { payload }) => {
        state.swapLoading = false;
        toast.success("swap successfull");
      })
      .addCase(swapBattery.rejected, (state, { payload }) => {
        state.swapLoading = false;
        toast.error("error in swapBattery");
        console.log(payload);
      });
  },
});

export default batterySlice.reducer;
