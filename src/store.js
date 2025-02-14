import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/AuthSlice";
import userReducer from "./features/user/UserSlice";

const store = configureStore({
  reducer: {
    authReducer,
    userReducer,
  },
});

export default store;
