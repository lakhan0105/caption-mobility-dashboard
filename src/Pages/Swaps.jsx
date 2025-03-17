import React, { useEffect } from "react";
import { Modal, PageHeader, SwapForm } from "../Components";
import { PiSwapBold } from "react-icons/pi";
import { useDispatch, useSelector } from "react-redux";
import { showModal } from "../features/modal/modalSlice";
import { getAllRecords } from "../features/record/recordSlice";

import { FaArrowRightLong } from "react-icons/fa6";
import { IoCalendar } from "react-icons/io5";
import { TbClock } from "react-icons/tb";
import { AiFillClockCircle } from "react-icons/ai";

import { nanoid } from "nanoid";
import moment from "moment/moment";
import { swapBattery } from "../features/battery/batterySlice";

function Swaps() {
  const dispatch = useDispatch();

  // get the records state from recordReducer
  const { isLoading, records } = useSelector((state) => state.recordReducer);

  // run the func to load the records when the page loads
  useEffect(() => {
    dispatch(getAllRecords());
  }, [dispatch, swapBattery]);

  return (
    <section className="w-full max-w-[900px] md:ml-[300px] md:w-[calc(100%-300px)] px-0 pt-0 z-40">
      {/* PAGE HEADER */}
      <PageHeader
        heading={"swaps"}
        btnName={"swap"}
        handleFunction={() => {
          dispatch(showModal());
        }}
        icon={<PiSwapBold />}
      />

      {isLoading && <h2 className="text-center">Loading...</h2>}

      {/* MAIN CONTENT */}
      <div className="px-5 py-2 ">
        {records?.map((record) => {
          const {
            userId,
            userName,
            oldBatRegNum,
            newBatRegNum,
            oldBatteryId,
            newBatteryId,
            swapDate,
          } = record;

          return (
            <article className="flex justify-between mb-12" key={nanoid()}>
              {/* LEFT */}
              <div className="flex gap-4">
                {/* dot element */}
                <div className="flex flex-col items-center relative">
                  <div className="w-[12.5px] h-[12.5px] bg-red-400 rounded-lg mt-1.5"></div>

                  {/* line */}
                  <div className="w-[1px] h-[95px] bg-red-400 absolute bottom-0 top-6"></div>
                </div>

                {/* user swap information */}
                <div>
                  <h3 className="text-md font-semibold">{userName}</h3>

                  {/* battery swap information */}
                  <h4 className="italic text-xs flex items-center gap-2 tracking-wider uppercase">
                    {oldBatRegNum}
                    <span>
                      <FaArrowRightLong />
                    </span>
                    {newBatRegNum}
                  </h4>

                  {/* date of swap information */}
                  <div className="mt-2.5 text-gray-600 flex gap-4">
                    {/* day */}
                    <div className="flex items-center gap-1 text-sm">
                      <span className="translate-x-[-1]">
                        <IoCalendar />
                      </span>

                      <p className="text-xs mt-0.5">
                        {moment(swapDate).format("ll")}
                      </p>
                    </div>

                    {/* time */}
                    <div className="flex items-center gap-1 text-sm">
                      <span className="translate-x-[-1]">
                        <AiFillClockCircle />
                      </span>

                      <p className="text-xs mt-0.5">
                        {moment(swapDate).format("LT")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div>
                <button>view</button>
              </div>
            </article>
          );
        })}
      </div>

      <Modal>
        <SwapForm />
      </Modal>
    </section>
  );
}

export default Swaps;
