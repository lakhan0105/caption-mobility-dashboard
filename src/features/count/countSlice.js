import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { databases } from "../../appwrite";

const dbId = import.meta.env.VITE_DB_ID;
const totalCountCollId = import.meta.env.VITE_TOTAL_COLL_ID;
const totalCountDocId = import.meta.env.VITE_TOTAL_DOC_ID;

const initialState = {
  isLoading: null,
  totalUsers: null,
  totalBikes: null,
  totalBatteries: null,
};

// get counts
export const getTotalCounts = createAsyncThunk(
  "count/getTotalCounts",
  async (_, thunkAPI) => {
    try {
      const totalCountDoc = await databases.getDocument(
        dbId,
        totalCountCollId,
        totalCountDocId
      );

      console.log(totalCountDoc);

      return {
        totalUsers: totalCountDoc?.totalUsers,
        totalBikes: totalCountDoc?.totalBikes,
        totalBatteries: totalCountDoc?.totalBatteries,
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// update totalUsers
export const updateTotalCounts = createAsyncThunk(
  "count/updateTotalCounts",
  async (data, thunkAPI) => {
    try {
      const resp = await databases.updateDocument(
        dbId,
        totalCountCollId,
        totalCountDocId,
        data
      );
      return {
        totalUsers: resp?.totalUsers,
        totalBikes: resp?.totalBikes,
        totalBatteries: resp?.totalBatteries,
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

const countSlice = createSlice({
  name: "count",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(getTotalCounts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getTotalCounts.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.totalUsers = payload.totalUsers;
      })
      .addCase(getTotalCounts.rejected, (state, { payload }) => {
        state.isLoading = false;
        console.log(payload);
      })
      .addCase(updateTotalCounts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateTotalCounts.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.totalUsers = payload.totalUsers;
        state.totalBikes = payload.totalBikes;
        state.totalBatteries = payload.totalBatteries;
      })
      .addCase(updateTotalCounts.rejected, (state, { payload }) => {
        state.isLoading = false;
        console.log("error in updateTotalCounts");
        console.log(payload);
      });
  },
});

export default countSlice.reducer;
