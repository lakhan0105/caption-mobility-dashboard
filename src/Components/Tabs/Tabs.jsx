import React, { useEffect, useState } from "react";
import { databases } from "../../appwrite";
import moment from "moment";
import SimpleBtn from "../Buttons/SimpleBtn";
import { IoIosReturnLeft } from "react-icons/io";
import UserBikeDetails from "./UserBikeDetails";
import UserBatteryDetails from "./UserBatteryDetails";
import UserFullDetails from "./UserFullDetails";
import { useDispatch, useSelector } from "react-redux";
import { getBikeById } from "../../features/bike/bikeSlice";

const dbId = import.meta.env.VITE_DB_ID;
const usersCollId = import.meta.env.VITE_USERS_COLL_ID;
const batteriesCollId = import.meta.env.VITE_BATTERIES_COLL_ID;

function Tabs({ userDetails, handleReturnBike }) {
  const {
    $id: userId,
    bikeId: userBikeId,
    batteryId: userBatteryId,
    userStatus,
  } = userDetails;

  // tab Headings Data
  const tabHeadingsData = [
    { id: 1, name: "user-bike", label: "bike" },
    { id: 2, name: "user-battery", label: "battery" },
    { id: 3, name: "user-full-details", label: "full details" },
  ];

  // state to keep track of active tab
  const [activeTab, setActiveTab] = useState(tabHeadingsData[0].name);

  // handleActiveTab
  function handleActiveTab(e) {
    const name = e.target.name;
    setActiveTab(name);
  }

  const [userFullDetailsState, setUserFullDetailsState] = useState(userDetails);

  return (
    <section>
      {/* TAB HEADINGS */}
      <div
        className="h-[50px] flex text-sm px- pt-2 bg-gradient-to-r from-[#39434d] to-[#252c37]
 px-5 text-white mb-4"
      >
        {tabHeadingsData.map((heading) => {
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

      {/* TAB BIKE CONTENT */}
      {/* USER BIKE DETAILS */}
      {activeTab === "user-bike" && (
        <UserBikeDetails
          userBikeId={userBikeId}
          handleReturnBike={handleReturnBike}
        />
      )}

      {/* USER BATTERY DETAILS */}
      {activeTab === "user-battery" && (
        <UserBatteryDetails userBatteryId={userBatteryId} />
      )}

      {/* USER FULL DETAILS */}
      {activeTab === "user-full-details" && (
        <UserFullDetails userFullDetailsState={userFullDetailsState} />
      )}
    </section>
  );
}

export default Tabs;
