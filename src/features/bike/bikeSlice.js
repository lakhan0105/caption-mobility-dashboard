import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { databases } from "../../appwrite";
import { ID, Query } from "appwrite";
import toast from "react-hot-toast";

const dbId = import.meta.env.VITE_DB_ID;
const bikesCollId = import.meta.env.VITE_BIKES_COLL_ID;

const initialState = {
  isBikeLoading: null,
  bikesList: null,
  availableBikes: null,
};

export const getBikes = createAsyncThunk(
  "bike/getBikes",
  async (__, thunkAPI) => {
    try {
      const response = await databases.listDocuments(dbId, bikesCollId);
      console.log(response);
      return response.documents;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getAvailableBikes = createAsyncThunk(
  "bike/getAvailableBikes",
  async (_, thunkAPI) => {
    try {
      const response = await databases.listDocuments(dbId, bikesCollId, [
        Query.equal("bikeStatus", [false]),
      ]);
      console.log(response);
      return response.documents;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// update the bike details when the assign button is clicked
// (takes documentId as bikeId, userId, assignedAt, bikeStatus)
export const updateBike = createAsyncThunk(
  "bike/updateBike",
  async (data, thunkAPI) => {
    console.log("data in updateBike function...");

    try {
      const response = await databases.updateDocument(
        dbId, // databaseId
        bikesCollId, // collectionId
        data.bikeId, // documentId

        {
          bikeStatus: data.bikeStatus,
          currOwner: data.userId,
          assignedAt: new Date(),
        }
      );

      console.log("response after updating the bike details");
      console.log(response);

      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// add new bike
export const addBike = createAsyncThunk(
  "bike/addBike",
  async (data, thunkAPI) => {
    console.log(data);
    try {
      const resp = await databases.createDocument(
        dbId,
        bikesCollId,
        ID.unique(),
        data
      );

      return resp;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

const bikeSlice = createSlice({
  name: "bikeReducer",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(getBikes.pending, (state, action) => {
        state.isBikeLoading = true;
      })
      .addCase(getBikes.fulfilled, (state, { payload }) => {
        state.isBikeLoading = false;
        console.log("we found the bikes data");
        state.bikesList = payload;
      })
      .addCase(getBikes.rejected, (state, { payload }) => {
        state.isBikeLoading = false;
      })
      .addCase(getAvailableBikes.pending, (state, action) => {
        state.isBikeLoading = true;
      })
      .addCase(getAvailableBikes.fulfilled, (state, { payload }) => {
        state.isBikeLoading = false;
        console.log("we found the available bikes ");
        state.availableBikes = payload;
      })
      .addCase(getAvailableBikes.rejected, (state, { payload }) => {
        state.isBikeLoading = false;
        alert("error in getAvailableBikes");
        console.log(payload);
      })
      .addCase(updateBike.pending, (state, action) => {
        state.isBikeLoading = true;
      })
      .addCase(updateBike.fulfilled, (state, { payload }) => {
        state.isBikeLoading = false;
        console.log("updated the bike details...");
      })
      .addCase(updateBike.rejected, (state, { payload }) => {
        state.isBikeLoading = false;
        toast.error("error in updateBike");
        console.log(payload);
      })
      .addCase(addBike.pending, (state, action) => {
        state.isBikeLoading = true;
      })
      .addCase(addBike.fulfilled, (state, { payload }) => {
        state.isBikeLoading = false;
      })
      .addCase(addBike.rejected, (state, { payload }) => {
        state.isBikeLoading = false;
        alert("error in addNewBike");
        console.log(payload);
      });
  },
});

export default bikeSlice.reducer;
