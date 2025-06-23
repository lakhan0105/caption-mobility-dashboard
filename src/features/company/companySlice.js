import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { databases } from "../../appwrite";
import { ID, Query } from "appwrite";

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
    console.log(companyName);

    try {
      const resp = await databases.listDocuments(dbId, companyCollId, [
        Query.equal("companyName", companyName),
      ]);

      // if no companyName already exists, then create one
      if (resp.documents.length === 0) {
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
      let allDocuments = [];
      const limit = 100; // Increase limit per request
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const resp = await databases.listDocuments(dbId, companyCollId, [
          Query.limit(limit),
          Query.offset(offset),
        ]);
        allDocuments = [...allDocuments, ...resp.documents];
        offset += limit;
        hasMore = resp.documents.length === limit; // More documents exist if we got a full batch
      }

      console.log(
        "Fetched company names:",
        allDocuments.map((doc) => doc.companyName)
      );
      return allDocuments;
    } catch (error) {
      console.error("Error fetching company names:", error);
      return thunkAPI.rejectWithValue({
        message: error.message,
        code: error.code,
        details: error,
      });
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
