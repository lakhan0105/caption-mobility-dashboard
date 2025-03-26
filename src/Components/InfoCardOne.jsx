import React from "react";
import SimpleBtn from "./Buttons/SimpleBtn";

// accepts -> headingIcon, heading, children-> infoCardRow

function InfoCardOne({
  headingIcon,
  heading,
  children,
  cardBtnName,
  cardBtnIcon,
  cardExtraStyles,
  handleCardBtn,
}) {
  return (
    <section className="text-sm mx-5 mt-5 px-3.5 py-5 rounded border border-zinc-200/70 bg-white/80 mb-8">
      {/* CARD HEADING */}
      <div className="flex justify-between items-center border-b border-zinc-200/70 pb-3 mb-4  ">
        <div className="flex items-start gap-2">
          <span className="text-xl translate-y-[-5%]  text-zinc-700">
            {headingIcon}
          </span>
          <h2 className="font-semibold  text-zinc-700/90  capitalize">
            {heading}
          </h2>
        </div>

        {/* Card button */}
        {cardBtnName && (
          <SimpleBtn
            name={cardBtnName}
            icon={cardBtnIcon}
            extraStyles={cardExtraStyles}
            handleBtn={handleCardBtn}
          />
        )}
      </div>

      {/* INFO CARD ROWS AS CHILDRENS*/}
      {children}
    </section>
  );
}

export default InfoCardOne;
