import React from "react";
import { Navbar } from "./Components";
import Sidebar from "./Components/Sidebar";
import { Outlet } from "react-router";

function RootLayout() {
  return (
    <>
      <div className="">
        <Navbar />
        <Sidebar />
      </div>

      <Outlet />
    </>
  );
}

export default RootLayout;
