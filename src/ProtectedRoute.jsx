import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCurrUser } from "./features/auth/AuthSlice";
import { Navigate, Outlet } from "react-router";

function ProtectedRoute() {
  const { currUser } = useSelector((state) => state.authReducer);

  const dispatch = useDispatch();
  useEffect(() => {
    if (!currUser) {
      dispatch(fetchCurrUser());
    }
  }, []);

  return currUser ? <Outlet /> : <Navigate to={"/"} />;
}

export default ProtectedRoute;
