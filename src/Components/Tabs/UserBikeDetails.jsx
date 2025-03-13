import React, { useEffect, useState } from "react";
import SimpleBtn from "../Buttons/SimpleBtn";
import { IoIosReturnLeft } from "react-icons/io";
import moment from "moment";
import { FaPlus } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { showModal } from "../../features/modal/modalSlice";
import { getBikeById } from "../../features/bike/bikeSlice";

function UserBikeDetails({ userBikeId, handleReturnBike }) {
  const dispatch = useDispatch();

  const { bikeById, isLoading } = useSelector((state) => state.bikeReducer);

  useEffect(() => {
    dispatch(getBikeById(userBikeId));
  }, [userBikeId]);

  if (isLoading) {
    return <h2>Loading...</h2>;
  }

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

  // if (isLoading) {
  //   return <h2 className="p-2">Loading...</h2>;
  // }

  return (
    <div className="text-sm p-2">
      <div className="mb-5 flex justify-between items-start">
        <div>
          <h3 className="capitalize mb-0.5">bike Register Number</h3>
          <p className="text-xs text-zinc-500">{bikeById?.bikeRegNum}</p>
        </div>

        {/* RETURN BIKE BUTTON */}
        <SimpleBtn
          name={"return"}
          icon={<IoIosReturnLeft />}
          extraStyles={"bg-red-500/90 border-none text-white"}
          handleBtn={handleReturnBike}
        />
      </div>

      <div>
        <h3 className="capitalize mb-0.5">Assigned at</h3>
        <p className="text-xs text-zinc-500">
          {moment(bikeById?.assignedAt).format("lll")}
        </p>
      </div>
    </div>
  );
}

export default UserBikeDetails;
