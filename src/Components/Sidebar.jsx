import React from "react";
import { useSelector } from "react-redux";
import { NavLink } from "react-router";

function Sidebar() {
  const { currUser } = useSelector((state) => state.authReducer);

  return (
    <aside className="w-0 hidden md:block md:w-[300px] bg-gray-200 fixed top-0 bottom-0 left-0 z-50 pl-10 border-r">
      <div className="h-[100px] flex items-center gap-5 justify-between pr-4 borde">
        <h2 className="font-semibold text-xl">Dashboard</h2>
      </div>

      <ul className="flex flex-col gap-8 mt-1 pt-5 h-full">
        <li>
          <NavLink to={`dashboard/profile/${currUser?.id}`}>Profile</NavLink>
        </li>
        <li>
          <NavLink to={"dashboard/users"}>Users</NavLink>
        </li>
      </ul>
    </aside>
  );
}

export default Sidebar;
