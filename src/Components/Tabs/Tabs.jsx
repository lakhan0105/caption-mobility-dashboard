import React, { useState } from "react";
import UserFullDetails from "./UserFullDetails";
import UserRentalDetails from "./UserRentalDetails";
import UserPaymentDetails from "./UserPaymentDetails";

function Tabs({ userDetails, handleReturnBike }) {
  const {
    $id: userId,
    bikeId: userBikeId,
    batteryId: userBatteryId,
    userStatus,
    pendingAmount,
    paidAmount,
    depositAmount,
    chargerStatus,
  } = userDetails;

  console.log("userDetails", userDetails);

  // tab Headings Data
  const tabHeadingsData = [
    { id: 1, name: "user-rental", label: "rental" },
    { id: 2, name: "user-pending-payment", label: "payment" },
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
        className="h-[50px] flex text-sm pt-2 bg-gradient-to-r from-[#39434d] to-[#252c37]
 px-5 text-white mb-2"
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

      {/* USER RENTAL TAB */}
      {activeTab === "user-rental" && (
        <UserRentalDetails
          userId={userId}
          userBatteryId={userBatteryId}
          userBikeId={userBikeId}
          handleReturnBike={handleReturnBike}
          chargerStatus={chargerStatus}
        />
      )}

      {/* USER PAYMENT DETAILS TAB */}
      {activeTab === "user-pending-payment" && (
        <UserPaymentDetails
          paidAmount={paidAmount}
          depositAmount={depositAmount}
          pendingAmount={pendingAmount}
        />
      )}

      {/* USER FULL DETAILS */}
      {activeTab === "user-full-details" && (
        <UserFullDetails userFullDetailsState={userFullDetailsState} />
      )}
    </section>
  );
}

export default Tabs;
