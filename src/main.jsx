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
import { AuthPage, StartPage } from "./Pages/index.js";
import PublicRoute from "./PublicRoute.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

// router
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route element={<PublicRoute />}>
        <Route path="/" element={<StartPage />} />
        <Route path="/authPage" element={<AuthPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/profile" />
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
