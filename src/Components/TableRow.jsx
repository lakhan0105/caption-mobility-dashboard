import React from "react";
import { FaUserCircle } from "react-icons/fa";
import ViewBtn from "./viewBtn";

const TableRow = ({ id, name, email, phone }) => {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_0.5fr] text-sm py-5 px-6 hover:bg-gray-200/50 rounded-lg pointer">
      <p className="font-semibold flex items-center gap-4">
        <span className="text-xl">
          <FaUserCircle />
        </span>
        {name}
      </p>
      <p>{email}</p>
      <p>{phone}</p>

      <div className="flex gap-4 justify-center">
        <ViewBtn id={id} />
      </div>
    </div>
  );
};

export default TableRow;
