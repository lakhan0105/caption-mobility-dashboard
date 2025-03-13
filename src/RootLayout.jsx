import React, { useState } from "react";
import { Navbar } from "./Components";
import Sidebar from "./Components/Sidebar";
import { Outlet } from "react-router";
import SmallSidebar from "./Components/SmallSidebar";
import { useSelector } from "react-redux";
import SmallNavbar from "./Components/SmallNavbar";

function RootLayout() {
  // state to store the sidebar status
  const [smallSidebarState, setSmallSidebarState] = useState(false);

  const { isMobile } = useSelector((state) => state.deviceReducer);

  // function to toggle the smallSidebar
  function handleToggleSmallSidebar() {
    setSmallSidebarState((prev) => !prev);
  }

  return (
    <>
      <div className="">
        {isMobile ? (
          <SmallNavbar />
        ) : (
          <Navbar handleToggleSmallSidebar={handleToggleSmallSidebar} />
        )}

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
