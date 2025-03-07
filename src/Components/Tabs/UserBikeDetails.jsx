import React, { useEffect, useState } from "react";
import SimpleBtn from "../Buttons/SimpleBtn";
import { IoIosReturnLeft } from "react-icons/io";
import moment from "moment";
import { FaPlus } from "react-icons/fa6";
import { useDispatch } from "react-redux";
import { showModal } from "../../features/modal/modalSlice";

function UserBikeDetails({
  userBikeId,
  userBikeDetailsState,
  handleReturnBike,
}) {
  const dispatch = useDispatch();

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

  return (
    <div className="text-sm p-2">
      <div className="mb-5 flex justify-between items-start">
        <div>
          <h3 className="capitalize">current bike id</h3>
          <p className="text-[0.7rem] text-zinc-500">
            {userBikeDetailsState?.$id}
          </p>
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
        <h3 className="capitalize">Assigned at</h3>
        <p className="text-[0.7rem] text-zinc-500">
          {moment(userBikeDetailsState?.assignedAt).format("lll")}
        </p>
      </div>
    </div>
  );
}

export default UserBikeDetails;
