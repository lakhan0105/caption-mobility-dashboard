import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { databases } from "../../appwrite";
import { Query, ID } from "appwrite";
import toast from "react-hot-toast";

const dbId = import.meta.env.VITE_DB_ID;
const bikesCollId = import.meta.env.VITE_BIKES_COLL_ID;

const initialState = {
  isLoading: null,
  bikesList: [],
  bikesListCount: 0,
  availableBikes: null,
  bikeById: null,
  isEditBike: false,
  selectedBike: null,
};

export const getBikes = createAsyncThunk(
  "bike/getBikes",
  async (offset, thunkAPI) => {
    const limit = 20;
    try {
      const response = await databases.listDocuments(dbId, bikesCollId, [
        Query.limit(limit),
        Query.offset(offset),
      ]);
      console.log("fetching bikes list...");
      console.log(response);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getBikeById = createAsyncThunk(
  "bike/getBikeById",
  async (userBikeId, { rejectWithValue }) => {
    console.log(userBikeId);
    try {
      console.log("Fetching bike details...");
      const response = await databases.getDocument(
        dbId,
        bikesCollId,
        userBikeId
      );
      console.log(response);
      return response;
    } catch (error) {
      toast.error("Error while getting the user bike details by id");
      return rejectWithValue(error.message);
    }
  }
);

export const getAvailableBikes = createAsyncThunk(
  "bike/getAvailableBikes",
  async (_, thunkAPI) => {
    try {
      const limit = 100;
      let offset = 0;
      let allBikes = [];
      let total = 0;

      do {
        const response = await databases.listDocuments(dbId, bikesCollId, [
          Query.equal("bikeStatus", [false]),
          Query.limit(limit),
          Query.offset(offset),
        ]);
        allBikes = allBikes.concat(response.documents);
        total = response.total;
        offset += limit;
      } while (offset < total);

      return allBikes;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const updateBike = createAsyncThunk(
  "bike/updateBike",
  async (data, thunkAPI) => {
    const { bikeId, userId, bikeStatus, returnedAt } = data;
    try {
      const updateData = {
        bikeStatus,
        currOwner: userId,
      };
      if (bikeStatus) {
        updateData.assignedAt = new Date().toISOString();
      }
      if (!bikeStatus && returnedAt) {
        updateData.returnedAt = returnedAt;
      }

      const response = await databases.updateDocument(
        dbId,
        bikesCollId,
        bikeId,
        updateData
      );
      console.log("response after updating the bike details");
      console.log(response);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const addBike = createAsyncThunk(
  "bike/addBike",
  async (data, thunkAPI) => {
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

export const editBikeRegNum = createAsyncThunk(
  "bike/editBikeRegNum",
  async (data, thunkAPI) => {
    const { bikeId, bikeRegNum } = data;
    console.log(data);
    try {
      const resp = await databases.updateDocument(dbId, bikesCollId, bikeId, {
        bikeRegNum,
      });
      console.log(resp);
      return resp;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const deleteBike = createAsyncThunk(
  "bike/deleteBike",
  async (bikeId, thunkAPI) => {
    try {
      const resp = await databases.deleteDocument(dbId, bikesCollId, bikeId);
      return resp;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

const bikeSlice = createSlice({
  name: "bikeReducer",
  initialState,
  reducers: {
    setSelectedBike(state, { payload }) {
      state.selectedBike = payload;
    },
    setEditBike(state, { payload }) {
      state.isEditBike = payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getBikes.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getBikes.fulfilled, (state, { payload, meta }) => {
        state.isLoading = false;
        console.log("we found the bikes data");
        if (meta.arg === 0) {
          state.bikesList = payload.documents;
        } else {
          state.bikesList = [...state.bikesList, ...payload.documents];
        }
        state.bikesListCount = payload.total;
      })
      .addCase(getBikes.rejected, (state, { payload }) => {
        state.isLoading = false;
      })
      .addCase(getBikeById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getBikeById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bikeById = action.payload;
      })
      .addCase(getBikeById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(getAvailableBikes.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAvailableBikes.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        console.log("we found the available bikes ");
        state.availableBikes = payload;
      })
      .addCase(getAvailableBikes.rejected, (state, { payload }) => {
        state.isLoading = false;
        toast.error("error in getAvailableBikes");
        console.log(payload);
      })
      .addCase(updateBike.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateBike.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        console.log("updated the bike details...");
        toast.success("Updated bike details successfully!");
      })
      .addCase(updateBike.rejected, (state, { payload }) => {
        state.isLoading = false;
        toast.error("error in updateBike");
        console.log(payload);
      })
      .addCase(addBike.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addBike.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        toast.success("added new bike successfully!");
      })
      .addCase(addBike.rejected, (state, { payload }) => {
        state.isLoading = false;
        console.log(payload.code);
        if (payload.code === 409) {
          toast.error("bike with same id is already present!");
        }
        console.log(payload);
      })
      .addCase(editBikeRegNum.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(editBikeRegNum.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        toast.success("updated bike register number successfully!");
      })
      .addCase(editBikeRegNum.rejected, (state, { payload }) => {
        state.isLoading = false;
        console.log(payload.code);
        console.log(payload);
      })
      .addCase(deleteBike.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteBike.fulfilled, (state, { meta }) => {
        state.isLoading = false;
        const bikeId = meta.arg;
        state.bikesList = state.bikesList.filter((bike) => bike.$id !== bikeId);
        state.bikesListCount -= 1;
        toast.success("deleted the bike successfully!");
      })
      .addCase(deleteBike.rejected, (state, { payload }) => {
        state.isLoading = false;
        console.log(payload.code);
        toast.error("could not delete the bike");
        console.log(payload);
      });
  },
});

export const { setSelectedBike, setEditBike } = bikeSlice.actions;
export default bikeSlice.reducer;
