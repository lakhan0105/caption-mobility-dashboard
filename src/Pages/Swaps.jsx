import React, { useEffect, useState } from "react";
import { Modal, PageHeader, SwapForm, SwapInfoCard } from "../Components";
import { useDispatch, useSelector } from "react-redux";
import { getAllRecords, getTodayRecord } from "../features/record/recordSlice";
import { PiSwap } from "react-icons/pi";

import {
  getTodaySwapCount,
  swapBattery,
} from "../features/battery/batterySlice";
import SwapPageTabs from "../Components/Tabs/SwapPageTabs";
import { showModal } from "../features/modal/modalSlice";

function Swaps() {
  const dispatch = useDispatch();

  // get the records state from recordReducer
  const { isLoading, records, todayRecords } = useSelector(
    (state) => state.recordReducer
  );

  const { todaySwapCount } = useSelector((state) => state.batteryReducer);

  // tabs
  const tabHeadingsData = [
    { id: 1, name: "today", label: "today" },
    { id: 2, name: "all", label: "all swaps" },
  ];

  const [activeTab, setActiveTab] = useState(tabHeadingsData[0].name);

  function handleActiveTab(e) {
    const name = e.target.name;
    setActiveTab(name);
  }

  // run the func to load the records when the page loads
  useEffect(() => {
    dispatch(getTodaySwapCount());

    if (activeTab === "today") {
      dispatch(getTodayRecord());
    } else if (activeTab === "all") {
      dispatch(getAllRecords());
    }
  }, [dispatch, swapBattery, activeTab]);

  return (
    <section className="w-full max-w-[900px] md:ml-[300px] md:w-[calc(100%-300px)] px-0 pt-0 z-40">
      {/* PAGE HEADER */}
      <PageHeader
        heading={"swaps"}
        handleFunction={() => {
          dispatch(showModal());
        }}
      >
        <h3 className="text-xs text-zinc-100/90 pl-1 flex items-center gap-1">
          <span>{todaySwapCount <= 0 ? 0 : todaySwapCount}</span> swaps today
          <>
            <PiSwap />
          </>
        </h3>

        <SwapPageTabs
          tabHeadingsData={tabHeadingsData}
          activeTab={activeTab}
          handleActiveTab={handleActiveTab}
        />
      </PageHeader>

      {/* SWAP TAB CONTENT */}
      <div className="px-5 py-2 ">
        {activeTab === "today" && (
          <>
            {/* RENDER TODAY'S SWAP RECORDS */}
            {isLoading ? (
              <h2 className="text-center">loading...</h2>
            ) : (
              todayRecords?.map((record) => {
                return <SwapInfoCard key={record?.swapDate} record={record} />;
              })
            )}
          </>
        )}

        {activeTab === "all" && (
          <>
            {/* RENDER ALL SWAP RECORDS */}
            {isLoading ? (
              <h2 className="text-center">Loading...</h2>
            ) : (
              records?.map((record) => {
                return <SwapInfoCard key={record?.swapDate} record={record} />;
              })
            )}
          </>
        )}
      </div>

      <Modal>
        <SwapForm />
      </Modal>
    </section>
  );
}

export default Swaps;
