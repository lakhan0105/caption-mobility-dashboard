import React, { useEffect } from "react";
import SimpleBtn from "../Buttons/SimpleBtn";
import { IoIosReturnLeft } from "react-icons/io";
import moment from "moment";
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

  // Get bike details from Redux (includes bikeModel now)
  const { bikeById, isLoading } = useSelector((state) => state.bikeReducer);

  // Fetch bike details when userBikeId changes
  useEffect(() => {
    if (userBikeId) {
      dispatch(getBikeById(userBikeId));
    }
  }, [userBikeId, dispatch]);

  if (isLoading) {
    return <h2 className="p-2 text-center">Loading bike details...</h2>;
  }

  if (!userBikeId || !bikeById) {
    return null; // or some fallback UI if no bike assigned
  }

  return (
    <InfoCardOne headingIcon={<MdOutlinePedalBike />} heading={"bike details"}>
      {/* BIKE REGISTER NUMBER */}
      <InfoCardRowTwo
        heading={"bike register number"}
        value={bikeById?.bikeRegNum?.toUpperCase()}
      >
        <SimpleBtn
          name={"Return"}
          icon={<IoIosReturnLeft />}
          extraStyles={
            "border-[1.45px] border-red-400/50 font-semibold text-red-500 text-xs"
          }
          handleBtn={handleReturnBike}
        />
      </InfoCardRowTwo>

      {/* BIKE MODEL - NEW */}
      <InfoCardRow
        heading={"bike model"}
        value={bikeById?.bikeModel ? bikeById.bikeModel : "-"}
      />

      {/* BIKE ASSIGNMENT DATE */}
      <InfoCardRow
        heading={"assigned on"}
        value={moment(bikeById?.assignedAt).format("lll")}
      />
    </InfoCardOne>
  );
}

export default UserBikeDetails;
