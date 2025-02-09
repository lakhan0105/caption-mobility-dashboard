import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/AuthSlice";

const store = configureStore({
  reducer: {
    authReducer,
  },
});

export default store;
