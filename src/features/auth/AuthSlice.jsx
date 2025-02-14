import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { account, client, databases } from "../../appwrite";
import { Permission, Role, Teams } from "appwrite";

const adminTeamId = import.meta.env.VITE_ADMINS_TEAM_ID;
const dbId = import.meta.env.VITE_DB_ID;
const usersCollId = import.meta.env.VITE_USERS_COLL_ID;

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
      const response = await account.create(
        data.userId,
        data.email,
        data.password,
        data.name
      );

      // login the user
      const loginResp = await thunkAPI.dispatch(
        loginUser({ email: data.email, password: data.password })
      );

      if (!loginResp) {
        throw new Error("Login failed after account creation");
      }

      if (loginResp) {
        // save the user details after creating their account
        const docData = {
          userName: data.name,
          userEmail: data.email,
        };

        await thunkAPI.dispatch(
          saveUser({
            documentId: data.userId,
            docData,
          })
        );
      }

      return;
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

// store user details after account creation
export const saveUser = createAsyncThunk(
  "auth/saveUser",
  async ({ documentId, docData }, thunkAPI) => {
    try {
      const permissions = [
        Permission.read(Role.user(documentId)),
        Permission.update(Role.user(documentId)),
        Permission.delete(Role.user(documentId)),

        Permission.read(Role.user(adminTeamId)),
        Permission.update(Role.user(adminTeamId)),
        Permission.delete(Role.user(adminTeamId)),
      ];

      console.log("printing permisisons array...");
      console.log(permissions);

      const response = await databases.createDocument(
        dbId,
        usersCollId,
        documentId,
        docData,
        permissions
      );

      console.log("Response after saving the document");
      console.log(response);
      return;
    } catch (error) {
      console.log(error);
      return thunkAPI.rejectWithValue("error in saveUser", error);
    }
  }
);

// login a user
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (data, thunkAPI) => {
    console.log("inside loginUser function,", data);
    try {
      const response = await account.createEmailPasswordSession(
        data.email,
        data.password
      );
      console.log("loggining in...");
      console.log("login completed, getting user...");
      await new Promise((resolve) => setTimeout(resolve, 1000)); // small delay
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
    const data = await account.get();

    const currUser = {
      id: data.$id,
      email: data.email,
      name: data.name,
      createdAt: data.$createdAt,
    };

    // get the list of teams the user is part of
    const teams = new Teams(client);
    const teamsResponse = await teams.list();
    const teamList = teamsResponse?.teams || [];
    console.log("teams", teamList);

    let isAdmin = false;
    for (let team of teamList) {
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
      })
      .addCase(saveUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(saveUser.fulfilled, (state, action) => {
        state.isLoading = false;
        console.log("saved the user details in the backend");
        console.log(state.currUser);
      })
      .addCase(saveUser.rejected, (state, { payload }) => {
        state.isLoading = false;
        console.log("Error in savinf the user details", payload);
      });
  },
});

export const { setIsSignup, toggleIsSignup } = AuthSlice.actions;
export default AuthSlice.reducer;
