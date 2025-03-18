import React from "react";

// accepts -> headingIcon, heading, children-> infoCardRow

function InfoCardOne({ headingIcon, heading, children }) {
  return (
    <section className="text-sm mx-5 mt-5 px-3.5 py-5 rounded border border-zinc-200/70 bg-white/40 mb-5">
      {/* CARD HEADING */}
      <div className="flex items-start gap-2 border-b border-zinc-200/70 pb-3 mb-4  ">
        <span className="text-xl translate-y-[-5%]  text-zinc-700">
          {headingIcon}
        </span>
        <h2 className="font-semibold  text-zinc-700/90  capitalize">
          {heading}
        </h2>
      </div>

      {/* INFO CARD ROWS AS CHILDRENS*/}
      {children}
    </section>
  );
}

export default InfoCardOne;
