import React from "react";
import { LuPanelRightClose } from "react-icons/lu";

function LogoutBtn() {
  return (
    <button className=" px-2.5 py-1.5 text-sm bg-red-600/90 hover:bg-red-600  text-white rounded flex items-center gap-1.5 font-semibold">
      <span className="text-base">
        <LuPanelRightClose />
      </span>
      logout
    </button>
  );
}

export default LogoutBtn;
