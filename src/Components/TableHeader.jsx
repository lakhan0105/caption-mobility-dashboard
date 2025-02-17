import React from "react";

function TableHeader() {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_0.5fr] py-6 px-6 text-sm font-medium text-gray-600 uppercase">
      <p>User name</p>
      <p>Email</p>
      <p>Phone</p>
      <p className="justify-self-center">actions</p>
    </div>
  );
}

export default TableHeader;
