import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { databases } from "../../appwrite";
import { ID, Query } from "appwrite";
import { updateUserBattery } from "../user/UserSlice";
import toast from "react-hot-toast";
import { addRecord } from "../record/recordSlice";

const dbId = import.meta.env.VITE_DB_ID;
const batteriesCollId = import.meta.env.VITE_BATTERIES_COLL_ID;
const dailySwapRecordCollId = import.meta.env.VITE_DAILY_SWAP_RECORD_COLL_ID;
const adminTeamId = import.meta.env.VITE_ADMINS_TEAM_ID;

const initialState = {
  isLoading: null,
  batteriesList: null,
  availableBatteries: null,
  batteryById: null,
  swapLoading: false,
  isEditBattery: false,
  selectedBattery: null,
  todaySwapCount: null,
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
    const { oldBatteryId, newBatteryId, userId, totalSwapCount } = data;

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

      // increment the daily swaps collection
      await thunkAPI.dispatch(incrementDailySwapCount());

      return { success: true };
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const incrementDailySwapCount = createAsyncThunk(
  "battery/incrementDailySwapCount",
  async (_, thunkAPI) => {
    const today = new Date().toDateString();
    console.log(today);

    try {
      // check if a doc with today's day is already present
      // - if yes then, update its todaySwapCount
      // - if no then, create a new doc with today's date
      const resp = await databases.listDocuments(dbId, dailySwapRecordCollId, [
        Query.equal("todayDate", today),
      ]);

      if (resp.documents.length > 0) {
        const docId = resp.documents[0].$id;
        const todaySwapCount = resp.documents[0].todaySwapCount;

        const updatedDoc = await databases.updateDocument(
          dbId,
          dailySwapRecordCollId,
          docId,
          { todaySwapCount: todaySwapCount + 1 }
        );

        return updatedDoc;
      } else {
        const newDoc = await databases.createDocument(
          dbId,
          dailySwapRecordCollId,
          ID.unique(),
          { todayDate: today, todaySwapCount: 1 }
        );

        return newDoc;
      }
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getTodaySwapCount = createAsyncThunk(
  "battery/getTodaySwapCount",
  async (_, thunkAPI) => {
    const today = new Date().toDateString();

    try {
      const resp = await databases.listDocuments(dbId, dailySwapRecordCollId, [
        Query.equal("todayDate", today),
      ]);

      return resp;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// editBatRegNum
export const editBatRegNum = createAsyncThunk(
  "battery/editBatRegNum",
  async (data, thunkAPI) => {
    const { $id, batRegNum } = data;

    try {
      const resp = await databases.updateDocument(dbId, batteriesCollId, $id, {
        batRegNum,
      });

      return resp;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// deleteBattery
export const deleteBattery = createAsyncThunk(
  "battery/deleteBattery",
  async (batteryId, thunkAPI) => {
    console.log(batteryId);
    try {
      const resp = await databases.deleteDocument(
        dbId,
        batteriesCollId,
        batteryId
      );

      return resp;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

const batterySlice = createSlice({
  name: "batteryReducer",
  initialState,
  reducers: {
    setEditBattery(state, { payload }) {
      state.isEditBattery = payload;
    },
    setSelectedBattery(state, { payload }) {
      state.selectedBattery = payload;
    },
  },
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
        toast.success("add new battery successfully!");
      })
      .addCase(addNewBattery.rejected, (state, { payload }) => {
        state.isLoading = false;

        if (payload.code === 409) {
          toast.error("Battery with same batRegNum/id is already present!");
        }

        console.log("error in addNewBattery");
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
      })
      .addCase(editBatRegNum.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(editBatRegNum.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        toast.success("updated the battery details!");
      })
      .addCase(editBatRegNum.rejected, (state, { payload }) => {
        state.isLoading = false;
        toast.error("error in editBatRegNum");
        console.log(payload);
      })
      .addCase(deleteBattery.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(deleteBattery.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        toast.success("deleted battery successfully!");
      })
      .addCase(deleteBattery.rejected, (state, { payload }) => {
        state.isLoading = false;
        toast.error("error in deleteBattery");
        console.log(payload);
      })
      .addCase(getTodaySwapCount.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(getTodaySwapCount.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.todaySwapCount = payload.documents[0].todaySwapCount;
      })
      .addCase(getTodaySwapCount.rejected, (state, { payload }) => {
        state.isLoading = false;
        toast.error("error in getTodaySwapCount");
        console.log(payload);
      });
  },
});

export const { setEditBattery, setSelectedBattery } = batterySlice.actions;
export default batterySlice.reducer;
