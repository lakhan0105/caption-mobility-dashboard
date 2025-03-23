import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router";
import { fetchCurrUser } from "./features/auth/AuthSlice";

// renders only the unauthorized pages

function PublicRoute() {
  const { currUser } = useSelector((state) => state.authReducer);
  const dispatch = useDispatch();

  const location = useLocation();

  useEffect(() => {
    dispatch(fetchCurrUser());
  }, [dispatch]);

  return currUser ? (
    <Navigate
      to={location?.state?.from?.pathname || "dashboard/users"}
      replace
    />
  ) : (
    <Outlet />
  );
}

export default PublicRoute;
