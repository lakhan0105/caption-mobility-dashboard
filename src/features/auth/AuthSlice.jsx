import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import customFetch from "../../customFetch";
const adminTeamId = import.meta.env.VITE_ADMINS_TEAM_ID;

// initialState
const initialState = {
  currUser: null,
  isLoading: false,
  isSignup: false,
  errorMsg: null,
};

// create a account
export const createAccount = createAsyncThunk(
  "auth/createAccount",
  async (data, thunkAPI) => {
    try {
      const response = await customFetch.post("/account", data);
      console.log(response);
      return response.data;
    } catch (error) {
      console.log(error);

      if (error.status === 409) {
        return thunkAPI.rejectWithValue(
          "User with same email or id already exists"
        );
      }

      return thunkAPI.rejectWithValue("error in createAccount", error);
    }
  }
);

// login a user
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (data, thunkAPI) => {
    console.log("inside loginUser function,", data);
    try {
      const response = await customFetch.post("/account/sessions/email", data);
      console.log("loggining in...");

      if (response.status !== 201) {
        throw new Error("Login failed");
      }

      console.log("auth completed, getting user...");
      await new Promise((resolve) => setTimeout(resolve, 500)); // small delay
      return await getCurrUser();
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// getCurrUser
const getCurrUser = async () => {
  try {
    // get the account of the user
    const account = await customFetch.get("/account");

    const data = account.data;
    const currUser = {
      id: data.$id,
      email: data.email,
      name: data.name,
      createdAt: data.$createdAt,
    };

    // get the list of teams the user is part of
    const teamsResponse = await customFetch.get("/teams");
    const teams = teamsResponse.data?.teams || [];
    console.log("teams", teams);

    let isAdmin = false;
    for (let team of teams) {
      if (team.$id === adminTeamId) {
        isAdmin = true;
        break;
      }
    }

    console.log("after checking if the user is admin or not...");
    console.log(currUser);
    console.log("isAdmin:", isAdmin);
    return { ...currUser, isAdmin };
  } catch (error) {
    console.log("Error fetching the currUser", error);
    return null;
  }
};

// fetCurrUser (for persisting the curr user)
export const fetchCurrUser = createAsyncThunk(
  "auth/fetchCurrUser",
  async (_, thunkAPI) => {
    try {
      return await getCurrUser();
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

// authslice
const AuthSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setIsSignup(state, action) {
      const btnName = action.payload;

      if (btnName === "signup") {
        state.isSignup = true;
      } else if (btnName === "login") {
        state.isSignup = false;
      }
    },
    toggleIsSignup(state) {
      state.isSignup = !state.isSignup;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(createAccount.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createAccount.fulfilled, (state) => {
        state.isLoading = false;
        console.log(state);
      })
      .addCase(createAccount.rejected, (state, { payload }) => {
        state.isLoading = false;
        console.log("Error while creating an account", payload);
        state.errorMsg = payload;
      })
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.currUser = payload;
        console.log("login completed successfully");
        console.log(payload);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        console.log("Login error:", action.payload);
      })
      .addCase(fetchCurrUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currUser = action.payload;
        console.log("completed fetching the currUser");
        console.log(state.currUser);
      })
      .addCase(fetchCurrUser.rejected, (state, { payload }) => {
        state.isLoading = false;
        console.log("Error in fetching the curUser", payload);
      });
  },
});

export const { setIsSignup, toggleIsSignup } = AuthSlice.actions;
export default AuthSlice.reducer;
