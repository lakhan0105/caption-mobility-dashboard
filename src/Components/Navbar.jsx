import React from "react";
import LogoutBtn from "./LogoutBtn";

function Navbar() {
  return (
    <nav className="ml-[300px] w-[calc(100%-300px)] px-9 xl:px-14 h-[100px] bg-[#F8F9FA] bg-transparent flex justify-between items-center relative z-10">
      <h2 className="font-bold text-2xl">Caption Mobility</h2>

      {/* nav right */}
      <div className="xl:px-10 ">
        <LogoutBtn />
      </div>
    </nav>
  );
}

export default Navbar;
