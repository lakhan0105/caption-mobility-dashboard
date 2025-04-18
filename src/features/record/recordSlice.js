import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { databases } from "../../appwrite";
import { ID, Query } from "appwrite";

const dbId = import.meta.env.VITE_DB_ID;
const recordCollId = import.meta.env.VITE_RECORD_COLL_ID;

console.log(recordCollId);

const initialState = {
  isLoading: null,
  records: null,
  todayRecords: null,
};

// add the record after the swap is completed
export const addRecord = createAsyncThunk(
  "record/addRecord",
  async (data, thunkAPI) => {
    try {
      const resp = await databases.createDocument(
        dbId,
        recordCollId,
        ID.unique(),
        data
      );
      return resp.documents;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// getAllRecords
export const getAllRecords = createAsyncThunk(
  "record/getAllRecords",
  async (_, thunkAPI) => {
    try {
      const resp = await databases.listDocuments(dbId, recordCollId, [
        Query.orderDesc("swapDate"),
      ]);
      return resp.documents;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// todayRecord (returns today's documents from records collection)
export const getTodayRecord = createAsyncThunk(
  "record/todayRecord",
  async (_, thunkAPI) => {
    const today = new Date();
    const startDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    try {
      const resp = await databases.listDocuments(dbId, recordCollId, [
        Query.between("swapDate", startDay, endDay),
      ]);

      return resp;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

const recordSlice = createSlice({
  name: "record",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(addRecord.pending, (state, { payload }) => {
        state.isLoading = true;
      })
      .addCase(addRecord.fulfilled, (state, { payload }) => {
        state.isLoading = false;
      })
      .addCase(addRecord.rejected, (state, { payload }) => {
        state.isLoading = false;
        alert("error in record/addRecord");
        console.log(payload);
      })
      .addCase(getAllRecords.pending, (state, { payload }) => {
        state.isLoading = true;
      })
      .addCase(getAllRecords.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.records = payload;
      })
      .addCase(getAllRecords.rejected, (state, { payload }) => {
        state.isLoading = false;
        alert("error in record/getAllRecords");
        console.log(payload);
      })
      .addCase(getTodayRecord.pending, (state, { payload }) => {
        state.isLoading = true;
      })
      .addCase(getTodayRecord.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.todayRecords = payload.documents;
      })
      .addCase(getTodayRecord.rejected, (state, { payload }) => {
        state.isLoading = false;
        alert("error in record/getTodayRecord");
        console.log(payload);
      });
  },
});

export default recordSlice.reducer;
