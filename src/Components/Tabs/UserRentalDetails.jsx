import React from "react";
import UserBikeDetails from "./UserBikeDetails";
import UserBatteryDetails from "./UserBatteryDetails";

function UserRentalDetails({ userBikeId, handleReturnBike, userBatteryId }) {
  return (
    <div className="pt-2 mb-24">
      <UserBikeDetails
        userBikeId={userBikeId}
        handleReturnBike={handleReturnBike}
      />

      {/* show this component only if the battery details are present */}
      {userBatteryId && <UserBatteryDetails userBatteryId={userBatteryId} />}
    </div>
  );
}

export default UserRentalDetails;
