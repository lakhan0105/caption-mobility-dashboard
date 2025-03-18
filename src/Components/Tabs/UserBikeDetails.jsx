import React, { useEffect, useState } from "react";
import SimpleBtn from "../Buttons/SimpleBtn";
import { IoIosReturnLeft } from "react-icons/io";
import moment from "moment";
import { FaPlus } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { showModal } from "../../features/modal/modalSlice";
import { getBikeById } from "../../features/bike/bikeSlice";
import { MdOutlineElectricBike } from "react-icons/md";
import { MdOutlinePedalBike } from "react-icons/md";
import InfoCardOne from "../InfoCardOne";
import InfoCardRow from "../InfoCardRow";

function UserBikeDetails({ userBikeId, handleReturnBike }) {
  const dispatch = useDispatch();

  // get the details of the bike -> stored in bikeById
  const { bikeById, isLoading } = useSelector((state) => state.bikeReducer);

  // if the user has a bike, then get the details of that assigned bike when the page loads
  useEffect(() => {
    if (userBikeId) {
      dispatch(getBikeById(userBikeId));
    }
  }, [userBikeId]);

  // if no bike was found associated to the user, then show the assign button
  if (!userBikeId) {
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
    return <h2 className="p-2">Loading...</h2>;
  }

  return (
    <InfoCardOne headingIcon={<MdOutlinePedalBike />} heading={"bike details"}>
      {/* BIKE REGISTER NUMBER */}
      <InfoCardRow
        heading={"bike register number"}
        value={bikeById?.bikeRegNum}
      />

      {/* BIKE ASSIGNMENT DATE */}
      <InfoCardRow
        heading={"assigned on"}
        value={moment(bikeById?.assignedAt).format("lll")}
      />

      {/* BUTTON TO RETURN THE BIKE */}
      <SimpleBtn
        name={"Return"}
        icon={<IoIosReturnLeft />}
        extraStyles={
          "border-[1.45px] border-red-400/50 font-semibold text-red-500 flex-row-reverse text-xs"
        }
        handleBtn={handleReturnBike}
      />
    </InfoCardOne>
  );
}

export default UserBikeDetails;
