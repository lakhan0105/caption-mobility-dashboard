import React from "react";

function GenericTable({ children }) {
  return (
    <div className="rounded-lg shadow shadow-gray-200/10 w-full pb-28">
      {children}
    </div>
  );
}

export default GenericTable;
