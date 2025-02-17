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
import { AuthPage, StartPage, Users } from "./Pages/index.js";
import PublicRoute from "./PublicRoute.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import RootLayout from "./RootLayout.jsx";
import Profile from "./Pages/Profile.jsx";
import AdminRoute from "./AdminRoute.jsx";

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
          </Route>
        </Route>
      </Route>
    </>
  )
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router}></RouterProvider>
    </Provider>
  </StrictMode>
);
