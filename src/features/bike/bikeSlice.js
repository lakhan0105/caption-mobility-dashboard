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
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getBikeById = createAsyncThunk(
  "bike/getBikeById",
  async (userBikeId, { rejectWithValue }) => {
    try {
      const response = await databases.getDocument(
        dbId,
        bikesCollId,
        userBikeId
      );
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
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const addBike = createAsyncThunk(
  "bike/addBike",
  async (data, thunkAPI) => {
    const { bikeRegNum, bikeModel } = data;
    try {
      const resp = await databases.createDocument(
        dbId,
        bikesCollId,
        ID.unique(),
        {
          bikeRegNum: bikeRegNum.toLowerCase(),
          bikeModel: bikeModel?.trim() || "",
        }
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
    const { bikeId, bikeRegNum, bikeModel } = data;
    try {
      const updateData = { bikeRegNum };
      if (bikeModel !== undefined) {
        updateData.bikeModel = bikeModel.trim();
      }
      const resp = await databases.updateDocument(
        dbId,
        bikesCollId,
        bikeId,
        updateData
      );
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
        if (meta.arg === 0) {
          state.bikesList = payload.documents;
        } else {
          state.bikesList = [...state.bikesList, ...payload.documents];
        }
        state.bikesListCount = payload.total;
      })
      .addCase(getBikes.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(getBikeById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getBikeById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bikeById = action.payload;
      })
      .addCase(getBikeById.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(getAvailableBikes.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAvailableBikes.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.availableBikes = payload;
      })
      .addCase(getAvailableBikes.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(updateBike.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateBike.fulfilled, (state) => {
        state.isLoading = false;
        toast.success("Updated bike details successfully!");
      })
      .addCase(updateBike.rejected, (state) => {
        state.isLoading = false;
        toast.error("error in updateBike");
      })
      .addCase(addBike.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addBike.fulfilled, (state) => {
        state.isLoading = false;
        toast.success("added new bike successfully!");
      })
      .addCase(addBike.rejected, (state, { payload }) => {
        state.isLoading = false;
        if (payload.code === 409) {
          toast.error("bike with same id is already present!");
        }
      })
      .addCase(editBikeRegNum.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(editBikeRegNum.fulfilled, (state) => {
        state.isLoading = false;
        toast.success("updated bike details successfully!");
      })
      .addCase(editBikeRegNum.rejected, (state) => {
        state.isLoading = false;
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
      .addCase(deleteBike.rejected, (state) => {
        state.isLoading = false;
        toast.error("could not delete the bike");
      });
  },
});

export const { setSelectedBike, setEditBike } = bikeSlice.actions;
export default bikeSlice.reducer;
