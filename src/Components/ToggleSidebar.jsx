import React from "react";
import { FaBars } from "react-icons/fa6";

function ToggleSidebar({ handleToggleSmallSidebar }) {
  return (
    <button
      className="text-2xl mt-1 cursor-pointer md:hidden"
      onClick={handleToggleSmallSidebar}
    >
      <FaBars />
    </button>
  );
}

export default ToggleSidebar;
