import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCurrUser } from "./features/auth/AuthSlice";
import { Navigate, Outlet } from "react-router";
import { updateIsMobile } from "./features/device/deviceSlice";

function ProtectedRoute() {
  const { currUser } = useSelector((state) => state.authReducer);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!currUser) {
      dispatch(fetchCurrUser());
    }

    // check the innerWidth of the screen to change the ui of the table
    function handleResize() {
      dispatch(updateIsMobile(window.innerWidth < 769));
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return currUser ? <Outlet /> : <Navigate to={"/"} />;
}

export default ProtectedRoute;
