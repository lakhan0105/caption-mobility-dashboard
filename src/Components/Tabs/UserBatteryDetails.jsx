import React, { useEffect, useState } from "react";
import moment from "moment";
import SimpleBtn from "../Buttons/SimpleBtn";
import { FaPlus } from "react-icons/fa6";
import { showModal } from "../../features/modal/modalSlice";
import { useDispatch, useSelector } from "react-redux";
import { getBatteryById } from "../../features/battery/batterySlice";

function UserBatteryDetails({ userBatteryId }) {
  const dispatch = useDispatch();
  const { batteryById, isLoading } = useSelector(
    (state) => state.batteryReducer
  );

  useEffect(() => {
    dispatch(getBatteryById(userBatteryId));
  }, [userBatteryId, dispatch]);

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
          <h3 className="capitalize mb-0.5">battery Register Number</h3>
          <p className="text-xs text-zinc-500">{batteryById?.batRegNum}</p>
        </div>

        {/* SWAP BATTERY BUTTON */}
        <button
          onClick={() => {
            dispatch(showModal());
          }}
        >
          swap
        </button>
      </div>

      <div>
        <h3 className="capitalize mb-0.5">Assigned at</h3>
        <p className="text-xs text-zinc-500">
          {moment(batteryById?.assignedAt).format("lll")}
        </p>
      </div>
    </div>
  );
}

export default UserBatteryDetails;
