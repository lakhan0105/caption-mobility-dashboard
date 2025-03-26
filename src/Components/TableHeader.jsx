import React from "react";

function TableHeader({ data, cols }) {
  return (
    <div
      style={{ gridTemplateColumns: cols }}
      className="grid py-3.5 px-5 md:px-6 text-xs font-medium text-zinc-700/80 uppercase gap-3"
    >
      {data.map((item, index) => {
        return (
          <p className={index === 2 ? "justify-self-center" : ""} key={index}>
            {item}
          </p>
        );
      })}
    </div>
  );
}

export default TableHeader;
