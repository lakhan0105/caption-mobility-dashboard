import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { databases } from "../../appwrite";
import { ID } from "appwrite";

const dbId = import.meta.env.VITE_DB_ID;
const companyCollId = import.meta.env.VITE_COMPANY_COLL_ID;

const initialState = {
  isLoading: false,
  companyNames: null,
};

// addCompanyIfNew
export const addCompanyIfNew = createAsyncThunk(
  "company/addCompanyIfNew",
  async (companyName, thunkAPI) => {
    try {
      const resp = await databases.listDocuments(dbId, companyCollId);
      const existingCompanies = resp?.documents?.map((doc) => doc.companyName);

      if (!existingCompanies.includes(companyName)) {
        const resp = await databases.createDocument(
          dbId,
          companyCollId,
          ID.unique(),
          { companyName }
        );
        return resp;
      }
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// getCompanyNames
export const getCompanyNames = createAsyncThunk(
  "company/getCompanyNames",
  async (_, thunkAPI) => {
    try {
      const resp = await databases.listDocuments(dbId, companyCollId);
      return resp.documents;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

const companySlice = createSlice({
  name: "company",
  initialState,
  extraReducers(builder) {
    builder
      .addCase(addCompanyIfNew.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addCompanyIfNew.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(addCompanyIfNew.rejected, (state, { payload }) => {
        alert("error in company/addCompanyIfNew");
        console.log(payload);
      })
      .addCase(getCompanyNames.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCompanyNames.fulfilled, (state, { payload }) => {
        state.isLoading = false;

        state.companyNames = payload?.map((item) => {
          return item.companyName;
        });
      })
      .addCase(getCompanyNames.rejected, (state, { payload }) => {
        alert("error in company/getCompanyNames");
        console.log(payload);
      });
  },
});

export default companySlice.reducer;
