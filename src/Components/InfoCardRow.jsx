import React from "react";

// accepts -> heading, value
function InfoCardRow({ heading, value }) {
  return (
    <div className="mb-5">
      <h3 className="capitalize mb-0 text-[11px] text-zinc-500 ">{heading}</h3>
      <p className="text-xs text-zinc-700/90 font-medium">{value}</p>
    </div>
  );
}

export default InfoCardRow;
