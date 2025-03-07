import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "../features/modal/modalSlice";
import { getAvailableBikes } from "../features/bike/bikeSlice";
import SubmitBtn from "./Buttons/SubmitBtn";
import { useParams } from "react-router";
import { assignBikeToUser } from "../features/user/UserSlice";
import { getAvailableBatteries } from "../features/battery/batterySlice";

function AssignForm({ getUser }) {
  const dispatch = useDispatch();
  const userId = useParams().id;
  console.log(userId);

  useEffect(() => {
    dispatch(getAvailableBikes());
    dispatch(getAvailableBatteries());
  }, []);

  // get the list of available bikes
  const { availableBikes, isBikeLoading } = useSelector(
    (state) => state.bikeReducer
  );

  // get the list of available batteries
  const { availableBatteries, isBatteryLoading } = useSelector(
    (state) => state.batteryReducer
  );

  const [assignmentData, setAssignmentData] = useState({
    userId: userId,
    selectedBikeId: null,
    selectedBatteryId: null,
  });

  // handleChange (runs when the select bike form is modified)
  function handleChange(e) {
    const key = e.target.name;
    const value = e.target.value;

    setAssignmentData((prev) => {
      return { ...prev, [key]: value };
    });
  }

  // handleAssignBike
  function handleAssignBike(e) {
    e.preventDefault();

    // check if the bike is selected by the user
    if (!assignmentData.selectedBikeId || !assignmentData.selectedBatteryId) {
      alert("please select bike & battery");
      return;
    }

    // - assign the bike to the user with the particular id in appwrite
    // - change the userStatus to true
    // - change the status of that bike to true
    // - show a popup and the assignbike button should dissappear from the user profile and add a return bike button
    dispatch(
      assignBikeToUser({
        ...assignmentData,
      })
    )
      .unwrap()
      .then(() => {
        dispatch(closeModal());
        getUser();
      })
      .catch((error) => console.log("error in assigning a bike", error));
  }

  // display this when the bikes data is loading
  if (isBikeLoading) {
    return <h2>Loading...</h2>;
  }

  return (
    <form className="bg-white w-full max-w-[400px] px-10 py-10 pt-14 rounded flex flex-col gap-4 relative">
      {/* CLOSE MODAL BUTTON */}
      <button
        className="absolute right-4 top-4 cursor-pointer"
        onClick={() => {
          dispatch(closeModal());
        }}
      >
        close
      </button>

      {/* SELECT INPUT FOR BIKE  */}
      <label htmlFor="bike">Select Bike</label>
      <select
        name="selectedBikeId"
        id="bike"
        className="border rounded text-sm"
        onChange={handleChange}
        value={assignmentData.selectedBikeId || ""}
      >
        <option value="" disabled>
          bikes
        </option>

        {availableBikes?.map((bike) => {
          const { $id } = bike;
          return (
            <option value={$id} key={$id}>
              {$id}
            </option>
          );
        })}
      </select>

      {/* SELECT INPUT FOR BATTERY  */}
      <label htmlFor="bike">Select Battery</label>
      <select
        name="selectedBatteryId"
        id="battery"
        className="border rounded text-sm"
        onChange={handleChange}
        value={assignmentData.selectedBatteryId || ""}
      >
        <option value="" disabled>
          batteries
        </option>

        {availableBatteries?.map((battery) => {
          const { $id, batRegNum } = battery;
          return (
            <option value={$id} key={$id}>
              {batRegNum}
            </option>
          );
        })}
      </select>

      <SubmitBtn text={"Assign bike"} handleSubmit={handleAssignBike} />
    </form>
  );
}

export default AssignForm;
