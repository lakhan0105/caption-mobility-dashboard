import React from "react";

function SimpleBtn({ icon, name, extraStyles, handleBtn }) {
  return (
    <button
      className={`px-4 py-1 rounded border border-indigo-950 flex items-center gap-1.5 ${extraStyles}`}
      onClick={handleBtn}
    >
      <span className="text-[0.7rem]">{icon}</span>
      {name}
    </button>
  );
}

export default SimpleBtn;
