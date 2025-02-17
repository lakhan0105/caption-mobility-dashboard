import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/AuthSlice";
import userReducer from "./features/user/UserSlice";
import modalReducer from "./features/modal/modalSlice";

const store = configureStore({
  reducer: {
    authReducer,
    userReducer,
    modalReducer,
  },
});

export default store;
