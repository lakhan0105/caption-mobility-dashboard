import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router";
import { fetchCurrUser } from "./features/auth/AuthSlice";

// renders only the unauthorized pages

function PublicRoute() {
  const { currUser } = useSelector((state) => state.authReducer);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchCurrUser());
  }, [dispatch]);

  return currUser ? (
    <Navigate to={`dashboard/profile/${currUser.id}`} />
  ) : (
    <Outlet />
  );
}

export default PublicRoute;
