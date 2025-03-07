import React, { useEffect, useState } from "react";
import { databases } from "../../appwrite";
import moment from "moment";
import SimpleBtn from "../Buttons/SimpleBtn";
import { IoIosReturnLeft } from "react-icons/io";
import UserBikeDetails from "./UserBikeDetails";
import UserBatteryDetails from "./UserBatteryDetails";
import UserFullDetails from "./UserFullDetails";

const dbId = import.meta.env.VITE_DB_ID;
const usersCollId = import.meta.env.VITE_USERS_COLL_ID;
const bikesCollId = import.meta.env.VITE_BIKES_COLL_ID;

function Tabs({ userDetails, handleReturnBike }) {
  const {
    $id: userId,
    bikeId: userBikeId,
    batteryId: userBatteryId,
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

  // states to store bike details
  const [userBikeDetailsState, setUserBikeDetailsState] = useState();
  const [userFullDetailsState, setUserFullDetailsState] = useState(userDetails);

  // function to get the bike details of the current user
  async function getBikeById(userBikeId) {
    console.log("running the getBikeById function");
    try {
      const response = await databases.getDocument(
        dbId, // databaseId
        bikesCollId, // collectionId
        userBikeId // documentId
      );

      if (response) {
        setUserBikeDetailsState(response);
      }
    } catch (error) {
      alert("error while getting the user bike details");
      console.log(error);
    }
  }

  // when this component loads, load the bike details of the user
  useEffect(() => {
    if (activeTab === "user-bike" && userBikeId) {
      getBikeById(userBikeId);
    }
  }, [userBikeId]);

  return (
    <section className="mt-8">
      {/* TAB HEADINGS */}
      <div className="flex text-sm rounded border-b mb-4">
        {tabHeadingsData.map((heading) => {
          const { id, name, label } = heading;
          return (
            <button
              className={`border-b w-[100px] py-1 capitalize ${
                name === activeTab
                  ? "font-medium text-blue-500 border-blue-500"
                  : ""
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
          userBikeDetailsState={userBikeDetailsState}
          handleReturnBike={handleReturnBike}
        />
      )}

      {/* USER BATTERY DETAILS */}
      {/* <UserBatteryDetails userBatteryId={userBatteryId} /> */}

      {/* USER FULL DETAILS */}
      {activeTab === "user-full-details" && (
        <UserFullDetails userFullDetailsState={userFullDetailsState} />
      )}
    </section>
  );
}

export default Tabs;
