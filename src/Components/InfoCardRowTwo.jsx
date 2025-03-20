import React from "react";

function InfoCardRowTwo({ heading, value, children }) {
  return (
    <div className="mb-5 flex justify-between">
      <div>
        <h3 className="capitalize mb-0 text-[11px] text-zinc-500 ">
          {heading}
        </h3>
        <p className="text-xs text-zinc-700/90 font-medium">{value}</p>
      </div>

      <div>{children}</div>
    </div>
  );
}

export default InfoCardRowTwo;
