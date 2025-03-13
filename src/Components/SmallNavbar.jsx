import React from "react";
import { useSelector } from "react-redux";
import { NavLink } from "react-router";

function SmallNavbar() {
  const { currUser } = useSelector((state) => state.authReducer);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-gradient-to-r bg-gray-300 border
  h-[60px] px-5 shadow-sm"
    >
      <ul className="flex items-center justify-between gap-8 h-full">
        <li>
          <NavLink to={`dashboard/profile/${currUser?.id}`}>Profile</NavLink>
        </li>
        <li>
          <NavLink to={"dashboard/users"}>Users</NavLink>
        </li>
        <li>
          <NavLink to={"dashboard/bikes"}>Bikes</NavLink>
        </li>
        <li>
          <NavLink to={"dashboard/batteries"}>Batteries</NavLink>
        </li>
      </ul>
    </nav>
  );
}

export default SmallNavbar;
