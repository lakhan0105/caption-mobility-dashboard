import React from "react";
import { FaArrowRightLong } from "react-icons/fa6";
import { IoCalendar } from "react-icons/io5";
import { AiFillClockCircle } from "react-icons/ai";

import { nanoid } from "nanoid";
import moment from "moment/moment";

function SwapInfoCard({ record }) {
  const { userName, oldBatRegNum, newBatRegNum, swapDate, totalSwapCount } =
    record;

  return (
    <article className="flex justify-between mb-9" key={nanoid()}>
      {/* LEFT */}
      <div className="flex gap-4">
        {/* DOT ELEMENT */}
        <div className="flex flex-col items-center relative">
          <div className="w-[11.5px] h-[11.5px] bg-red-500 rounded-lg mt-1"></div>

          {/* line */}
          <div className="w-[0.7px] h-[70px] bg-red-400/70 absolute bottom-0 top-5"></div>
        </div>

        {/* USER SWAP INFORMATION*/}
        <div>
          <h3 className="text-sm font-semibold capitalize">{userName}</h3>

          {/* battery swap information */}
          <h4 className="text-[11px] text-zinc-600 flex items-center gap-2 tracking-wider uppercase">
            {oldBatRegNum}
            <span>
              <FaArrowRightLong />
            </span>
            {newBatRegNum}

            {/* totalswapcount */}
            <h4 className="text-[11px]">(swap number {totalSwapCount})</h4>
          </h4>

          {/* date of swap information */}
          <div className="mt-2 text-zinc-600/80 flex gap-4">
            {/* day */}
            <div className="flex items-center gap-1 text-xs">
              <span className="translate-x-[-1]">
                <IoCalendar />
              </span>

              <p className="text-[11px] mt-0.5">
                {moment(swapDate).format("ll")}
              </p>
            </div>

            {/* time */}
            <div className="flex items-center gap-1 text-xs">
              <span>
                <AiFillClockCircle />
              </span>

              <p className="text-[11px] mt-0.5">
                {moment(swapDate).format("LT")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div>{/* <button>view</button> */}</div>
    </article>
  );
}

export default SwapInfoCard;
