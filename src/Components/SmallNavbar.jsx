import React from "react";
import { NavLink } from "react-router";
import { FaUsers } from "react-icons/fa";
import { MdOutlinePedalBike } from "react-icons/md";
import { PiBatteryPlusBold } from "react-icons/pi";
import { PiSwapBold } from "react-icons/pi";
import { FaWallet } from "react-icons/fa6";

const links = [
  {
    id: 0,
    label: "users",
    path: "dashboard/users",
    icon: <FaUsers />,
  },
  {
    id: 1,
    label: "bikes",
    path: "dashboard/bikes",
    icon: <MdOutlinePedalBike />,
  },
  {
    id: 2,
    label: "batteries",
    path: "dashboard/batteries",
    icon: <PiBatteryPlusBold />,
  },
  {
    id: 3,
    label: "swaps",
    path: "dashboard/swaps",
    icon: <PiSwapBold />,
  },
  {
    id: 4,
    label: "payments",
    path: "dashboard/payments",
    icon: <FaWallet />,
  },
];

function SmallNavbar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-gradient-to-r bg-gray-300 border
  h-[50px] px-5 shadow-sm z-50"
    >
      <ul className="flex items-center justify-between gap-8 h-full capitalize">
        {links.map((link) => {
          const { id, path, label, icon } = link;

          return (
            <NavLink to={path} key={id}>
              {({ isActive }) => {
                return (
                  <li
                    className={`flex flex-col items-center ${
                      isActive ? "text-indigo-700" : "text-zinc-700"
                    }`}
                  >
                    <span className="text-lg">{icon}</span>
                    <p className="text-xs">{label}</p>
                  </li>
                );
              }}
            </NavLink>
          );
        })}
      </ul>
    </nav>
  );
}

export default SmallNavbar;
