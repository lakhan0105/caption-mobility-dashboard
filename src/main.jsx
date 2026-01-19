import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Provider } from "react-redux";
import store from "./store.js";

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router";

// import pages
import {
  AuthPage,
  Batteries,
  Bikes,
  StartPage,
  Swaps,
  UserDetails,
  Users,
  CallLogs,
} from "./Pages/index.js";
import PublicRoute from "./PublicRoute.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import RootLayout from "./RootLayout.jsx";
import Profile from "./Pages/Profile.jsx";
import AdminRoute from "./AdminRoute.jsx";
import { Toaster } from "react-hot-toast";
import Payments from "./Pages/Payments.jsx";

// router
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route element={<PublicRoute />}>
        <Route path="/" element={<StartPage />} />
        <Route path="/authPage" element={<AuthPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<RootLayout />}>
          <Route path="dashboard/profile/:id" element={<Profile />} />

          {/* users comp wrapped in adminRoute comp */}
          <Route element={<AdminRoute />}>
            <Route path="dashboard/users" element={<Users />} />
            <Route path="dashboard/users/:id" element={<UserDetails />} />
            <Route path="dashboard/bikes" element={<Bikes />} />
            <Route path="dashboard/batteries" element={<Batteries />} />
            <Route path="dashboard/swaps" element={<Swaps />} />
            <Route path="dashboard/payments" element={<Payments />} />
            <Route path="dashboard/call-logs" element={<CallLogs />} />
          </Route>
        </Route>
      </Route>
    </>
  )
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <Toaster />
      <RouterProvider router={router}></RouterProvider>
    </Provider>
  </StrictMode>
);
