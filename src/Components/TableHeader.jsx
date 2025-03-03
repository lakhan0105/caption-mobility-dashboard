import React from "react";

function TableHeader({ data, cols }) {
  return (
    <div
      style={{ gridTemplateColumns: cols }}
      className="grid py-4 px-2 md:px-6 text-sm font-medium text-gray-600 uppercase gap-3"
    >
      {data.map((item, index) => {
        return (
          <p className={index === 2 ? "justify-self-center" : ""}>{item}</p>
        );
      })}
    </div>
  );
}

export default TableHeader;
