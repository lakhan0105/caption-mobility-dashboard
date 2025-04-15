import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/AuthSlice";
import userReducer from "./features/user/UserSlice";
import modalReducer from "./features/modal/modalSlice";
import deviceReducer from "./features/device/deviceSlice";
import bikeReducer from "./features/bike/bikeSlice";
import batteryReducer from "./features/battery/batterySlice";
import recordReducer from "./features/record/recordSlice";
import companyReducer from "./features/company/companySlice";
import countReducer from "./features/count/countSlice";

const store = configureStore({
  reducer: {
    authReducer,
    userReducer,
    modalReducer,
    deviceReducer,
    bikeReducer,
    batteryReducer,
    recordReducer,
    companyReducer,
    countReducer,
  },
});

export default store;
