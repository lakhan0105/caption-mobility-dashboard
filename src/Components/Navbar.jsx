import React from "react";
import LogoutBtn from "./LogoutBtn";
import ToggleSidebar from "./ToggleSidebar";

function Navbar({ handleToggleSmallSidebar }) {
  return (
    <nav className="md:ml-[300px] md:w-[calc(100%-300px)] px-5 xl:px-14 h-[80px] md:h-[100px] bg-[#F8F9FA] bg-transparent flex justify-between items-center relative z-10 border-b">
      <h2 className="font-bold text-2xl">Caption Mobility</h2>

      {/* nav right */}
      <div className="xl:px-10 ">
        <LogoutBtn />
        <ToggleSidebar handleToggleSmallSidebar={handleToggleSmallSidebar} />
      </div>
    </nav>
  );
}

export default Navbar;
