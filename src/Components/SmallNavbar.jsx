import React from "react";
import { NavLink } from "react-router";
import { FaUsers } from "react-icons/fa";
import { MdOutlinePedalBike } from "react-icons/md";
import { PiBatteryPlusBold } from "react-icons/pi";
import { PiSwapBold } from "react-icons/pi";

function SmallNavbar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-gradient-to-r bg-gray-300 border
  h-[60px] px-5 shadow-sm"
    >
      <ul className="flex items-center justify-between gap-8 h-full capitalize">
        {/* USERS */}
        <NavLink to={"dashboard/users"}>
          <li className="flex flex-col items-center">
            <span className="text-lg">
              <FaUsers />
            </span>
            <p className="text-xs">users</p>
          </li>
        </NavLink>

        {/* BIKES */}
        <NavLink to={"dashboard/bikes"}>
          <li className="flex flex-col items-center">
            <span className="text-lg">
              <MdOutlinePedalBike />
            </span>
            <p className="text-xs">bikes</p>
          </li>
        </NavLink>

        {/* BATTERIES */}
        <NavLink to={"dashboard/batteries"}>
          <li className="flex flex-col items-center">
            <span className="text-lg">
              <PiBatteryPlusBold />
            </span>
            <p className="text-xs">batteries</p>
          </li>
        </NavLink>

        {/* SWAPS */}
        <NavLink to={"dashboard/batteries"}>
          <li className="flex flex-col items-center">
            <span className="text-lg">
              <PiSwapBold />
            </span>
            <p className="text-xs">swaps</p>
          </li>
        </NavLink>
      </ul>
    </nav>
  );
}

export default SmallNavbar;
