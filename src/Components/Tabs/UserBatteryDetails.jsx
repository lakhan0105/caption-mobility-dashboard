import React, { useEffect, useState } from "react";
import moment from "moment";
import SimpleBtn from "../Buttons/SimpleBtn";
import { FaPlus } from "react-icons/fa6";
import { showModal } from "../../features/modal/modalSlice";
import { useDispatch, useSelector } from "react-redux";
import { getBatteryById } from "../../features/battery/batterySlice";
import InfoCardOne from "../InfoCardOne";
import { PiBatteryPlusBold, PiSwap } from "react-icons/pi";
import InfoCardRow from "../InfoCardRow";
import { PiSwapBold } from "react-icons/pi";

function UserBatteryDetails({ userBatteryId }) {
  const dispatch = useDispatch();
  const { batteryById, isLoading } = useSelector(
    (state) => state.batteryReducer
  );

  useEffect(() => {
    if (userBatteryId) {
      dispatch(getBatteryById(userBatteryId));
    }
  }, [userBatteryId]);

  if (isLoading) {
    return <h2 className="text-center">Loading...</h2>;
  }

  return (
    <InfoCardOne
      heading={"battery details"}
      headingIcon={<PiBatteryPlusBold />}
    >
      {/* BATTERY NUMBER */}
      <InfoCardRow heading={"battery number"} value={batteryById?.batRegNum} />

      {/* BATTERY ASSIGNMENT DATE */}
      <InfoCardRow
        heading={"assigned on"}
        value={moment(batteryById?.assignedAt).format("lll")}
      />

      {/* SWAP BATTERY BUTTON */}
      <SimpleBtn
        icon={<PiSwapBold />}
        name={"Swap"}
        extraStyles={
          "border-[1.45px] border-zinc-400/50 font-semibold text-zinc-500 flex-row-reverse text-xs"
        }
        handleBtn={() => {
          dispatch(showModal());
        }}
      >
        swap
      </SimpleBtn>
    </InfoCardOne>
  );
}

export default UserBatteryDetails;
