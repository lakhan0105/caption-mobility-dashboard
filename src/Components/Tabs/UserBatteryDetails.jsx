import React, { useState } from "react";
import moment from "moment";
import SimpleBtn from "../Buttons/SimpleBtn";
import { FaPlus } from "react-icons/fa6";
import { showModal } from "../../features/modal/modalSlice";
import { useDispatch } from "react-redux";

function UserBatteryDetails({
  isLoading,
  userBatteryDetailsState,
  handleReturnBike,
  userBatteryId,
}) {
  const dispatch = useDispatch();

  if (!userBatteryId) {
    return (
      <SimpleBtn
        name={"Assign"}
        icon={<FaPlus />}
        extraStyles={"py-1.5 text-xs"}
        handleBtn={() => {
          dispatch(showModal());
        }}
      />
    );
  }

  if (isLoading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div className="text-sm p-2">
      <div className="mb-5 flex justify-between items-start">
        <div>
          <h3 className="capitalize">battery Register Number</h3>
          <p className="text-[0.7rem] text-zinc-500">
            {userBatteryDetailsState?.batRegNum}
          </p>
        </div>

        {/* SWAP BATTERY BUTTON */}
        <button>swap</button>
      </div>

      <div>
        <h3 className="capitalize">Assigned at</h3>
        <p className="text-[0.7rem] text-zinc-500">
          {moment(userBatteryDetailsState?.assignedAt).format("lll")}
        </p>
      </div>
    </div>
  );
}

export default UserBatteryDetails;
