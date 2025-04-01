import React from "react";

import { FiPlus } from "react-icons/fi";

function PageHeader({ heading, handleFunction, children }) {
  return (
    <section className="flex items-center h-[240px] gap-8 pt-14 pb-10 px-5 bg-gradient-to-r from-[#39434d] to-[#252c37] text-white mb-3 relative">
      {/* add button */}
      <button
        className="fixed bottom-20 right-3 p-2.5 rounded-[50%] bg-blue-500"
        onClick={handleFunction}
      >
        <span className="text-3xl">
          <FiPlus />
        </span>
      </button>

      {/* page name and button */}
      <div>
        <h2 className="text-4xl capitalize font-medium mb-3">{heading}</h2>

        {children}
      </div>
    </section>
  );
}

export default PageHeader;
