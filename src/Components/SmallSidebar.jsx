import React from "react";
import { useSelector } from "react-redux";
import { NavLink } from "react-router";
import { IoClose } from "react-icons/io5";

function SmallSidebar({ handleToggleSmallSidebar, smallSidebarState }) {
  const { currUser } = useSelector((state) => state.authReducer);

  return (
    <aside
      style={{
        width: smallSidebarState ? "100%" : "0%",
        paddingLeft: smallSidebarState ? "2rem" : "0%",
      }}
      className="overflow-hidden bg-gray-200 fixed top-0 bottom-0 left-0 z-50 border-r"
    >
      <div className="h-[80px] md:h-[100px] flex items-center gap-5 justify-between pr-4 borde">
        <h2 className="font-semibold text-xl">Dashboard</h2>
        <button onClick={handleToggleSmallSidebar} className="text-3xl">
          <IoClose />
        </button>
      </div>

      <ul className="flex flex-col gap-8 mt-1 pt-5 h-full">
        <li>
          <NavLink
            to={`dashboard/profile/${currUser?.id}`}
            onClick={handleToggleSmallSidebar}
          >
            Profile
          </NavLink>
        </li>
        <li>
          <NavLink to={"dashboard/users"} onClick={handleToggleSmallSidebar}>
            Users
          </NavLink>
        </li>
      </ul>
    </aside>
  );
}

export default SmallSidebar;
