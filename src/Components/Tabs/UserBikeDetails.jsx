import React, { useEffect, useState } from "react";
import SimpleBtn from "../Buttons/SimpleBtn";
import { IoIosReturnLeft } from "react-icons/io";
import moment from "moment";
import { FaPlus } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import {
  hideLoader,
  showAssignForm,
  showLoader,
  showModal,
} from "../../features/modal/modalSlice";
import { getBikeById } from "../../features/bike/bikeSlice";
import { MdOutlinePedalBike } from "react-icons/md";
import InfoCardOne from "../InfoCardOne";
import InfoCardRow from "../InfoCardRow";
import InfoCardRowTwo from "../InfoCardRowTwo";

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

  if (isLoading) {
    return <h2 className="p-2 text-center">Loading bike details...</h2>;
  }

  if (!userBikeId) {
  }

  return (
    <InfoCardOne headingIcon={<MdOutlinePedalBike />} heading={"bike details"}>
      {/* BIKE REGISTER NUMBER */}
      <InfoCardRowTwo
        heading={"bike register number"}
        value={bikeById?.bikeRegNum}
      >
        {/* button to return the bike */}
        <SimpleBtn
          name={"Return"}
          icon={<IoIosReturnLeft />}
          extraStyles={
            "border-[1.45px] border-red-400/50 font-semibold text-red-500 text-xs"
          }
          handleBtn={handleReturnBike}
        />
      </InfoCardRowTwo>

      {/* BIKE ASSIGNMENT DATE */}
      <InfoCardRow
        heading={"assigned on"}
        value={moment(bikeById?.assignedAt).format("lll")}
      />
    </InfoCardOne>
  );
}

export default UserBikeDetails;
