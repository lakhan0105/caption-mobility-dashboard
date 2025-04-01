import React, { useState } from "react";

function SwapPageTabs({ tabHeadingsData, activeTab, handleActiveTab }) {
  return (
    <div
      className="h-[50px] absolute bottom-0 left-0 flex text-sm pt-2 
px-5 text-zinc-100/90 mb-2"
    >
      {tabHeadingsData?.map((heading) => {
        const { id, name, label } = heading;
        return (
          <button
            className={`mb-2 w-[100px] py-1 capitalize ${
              name === activeTab ? "border-b border-white-500" : ""
            }`}
            name={name}
            key={id}
            onClick={handleActiveTab}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default SwapPageTabs;
