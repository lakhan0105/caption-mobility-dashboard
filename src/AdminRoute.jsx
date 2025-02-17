import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router";
import { fetchCurrUser } from "./features/auth/AuthSlice";

function AdminRoute() {
  const { currUser } = useSelector((state) => state.authReducer);

  const dispatch = useDispatch();
  useEffect(() => {
    if (!currUser) {
      dispatch(fetchCurrUser());
    }
  }, []);

  if (!currUser) {
    return <h2>Loading...</h2>;
  }

  return currUser.isAdmin ? <Outlet /> : <Navigate to={"/"} />;
}

export default AdminRoute;
