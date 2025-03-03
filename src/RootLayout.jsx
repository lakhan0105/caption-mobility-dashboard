import React, { useState } from "react";
import { Navbar } from "./Components";
import Sidebar from "./Components/Sidebar";
import { Outlet } from "react-router";
import SmallSidebar from "./Components/SmallSidebar";

function RootLayout() {
  // state to store the sidebar status
  const [smallSidebarState, setSmallSidebarState] = useState(false);

  // function to toggle the smallSidebar
  function handleToggleSmallSidebar() {
    setSmallSidebarState((prev) => !prev);
  }

  return (
    <>
      <div className="">
        <Navbar handleToggleSmallSidebar={handleToggleSmallSidebar} />
        <Sidebar />
        <SmallSidebar
          handleToggleSmallSidebar={handleToggleSmallSidebar}
          smallSidebarState={smallSidebarState}
        />
      </div>

      <Outlet />
    </>
  );
}

export default RootLayout;
