import React from "react";
import { FaUserCircle } from "react-icons/fa";
import ViewBtn from "./ViewBtn";

const TableRow = ({ id, name, company, phone, status }) => {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_0.5fr] text-sm py-4 px-6 hover:bg-gray-200/50 pointer border-t">
      <p className="font-semibold flex items-center gap-4">
        <span className="text-xl">
          <FaUserCircle />
        </span>
        {name}
      </p>
      <p>{phone}</p>
      <p>{company}</p>

      <div className="flex gap-4 justify-center text-xs">
        {status ? (
          <p className="bg-blue-200 px-4 py-1.5 rounded-2xl">Active</p>
        ) : (
          <p className="bg-red-400/80 px-3 py-1.5 rounded-2xl">Inactive</p>
        )}
      </div>
    </div>
  );
};

export default TableRow;
