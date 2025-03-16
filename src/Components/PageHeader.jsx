import React from "react";

function PageHeader({ heading, btnName, handleFunction, icon }) {
  return (
    <section className="flex items-center h-[240px] gap-8 pt-14 pb-10 px-5 bg-gradient-to-r from-[#39434d] to-[#252c37] text-white mb-3">
      {/* icon */}
      <div className="p-4 rounded bg-orange-400">
        <span className="text-7xl">{icon}</span>
      </div>

      {/* page name and button */}
      <div>
        <h2 className="text-4xl capitalize font-medium mb-2">{heading}</h2>
        <button
          className=" capitalize px-3 py-2 rounded-md bg-blue-500 font-medium text-white text-xs cursor-pointer"
          onClick={handleFunction}
        >
          {btnName}
        </button>
      </div>
    </section>
  );
}

export default PageHeader;
