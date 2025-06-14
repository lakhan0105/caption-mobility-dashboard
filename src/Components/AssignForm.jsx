import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "../features/modal/modalSlice";
import { getAvailableBikes } from "../features/bike/bikeSlice";
import SubmitBtn from "./Buttons/SubmitBtn";
import { useFetcher, useParams } from "react-router";
import { assignBikeToUser } from "../features/user/UserSlice";
import { getAvailableBatteries } from "../features/battery/batterySlice";
import InputRow from "./InputRow";
import toast from "react-hot-toast";

function AssignForm({ getUser, oldPendingAmount }) {
  const dispatch = useDispatch();
  const userId = useParams().id;

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
    pendingAmount: 0,
    paidAmount: 0,
    depositAmount: 0,
    chargerStatus: false,
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
      toast.error("please fill all the details");
      return;
    }

    console.log(assignmentData);

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
  if (isBikeLoading || isBatteryLoading) {
    return <h2>Loading...</h2>;
  }

  return (
    <form className="bg-white w-full max-w-[400px] px-10 py-10 pt-14 rounded flex flex-col gap-6 relative ">
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
      <div>
        <label htmlFor="bike">Select Bike</label>
        <select
          name="selectedBikeId"
          id="bike"
          className="border rounded text-sm block w-full"
          onChange={handleChange}
          value={assignmentData.selectedBikeId || ""}
        >
          <option value="" disabled>
            bikes
          </option>

          {availableBikes?.map((bike) => {
            const { $id, bikeRegNum } = bike;
            return (
              <option value={$id} key={$id}>
                {bikeRegNum}
              </option>
            );
          })}
        </select>
      </div>

      {/* SELECT INPUT FOR BATTERY  */}
      <div>
        <label htmlFor="bike">Select Battery</label>
        <select
          name="selectedBatteryId"
          id="battery"
          className="border rounded text-sm block w-full"
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
      </div>

      {/* CHARGER PROVIDED OR NOT */}
      <div className="flex gap-2">
        <input
          type="checkbox"
          id="chargerStatus"
          value={assignmentData.chargerStatus}
          onChange={() => {
            setAssignmentData((prev) => {
              return { ...prev, chargerStatus: !assignmentData.chargerStatus };
            });
          }}
        />
        <label htmlFor="chargerStatus">Charger provided</label>
      </div>

      {/* INPUT FOR DEPOSIT AMOUNT */}
      <div>
        <InputRow
          name={"depositAmount"}
          type={"number"}
          label={"Deposit Amount"}
          handleChange={handleChange}
          value={assignmentData.depositAmount}
        />
      </div>

      {/* INPUT FOR PAID AMOUNT */}
      <div>
        <InputRow
          name={"paidAmount"}
          type={"number"}
          label={"Paid Amount"}
          handleChange={handleChange}
          value={assignmentData.paidAmount}
        />
      </div>

      {/* INPUT FOR PENDING AMOUNT */}
      <div>
        <InputRow
          name={"pendingAmount"}
          type={"number"}
          label={"Pending Amount"}
          handleChange={handleChange}
          value={assignmentData.pendingAmount}
        >
          <p className="text-xs text-red-500 font-medium mb-1">
            old pending amount: ₹ {oldPendingAmount}
          </p>
        </InputRow>
      </div>

      <SubmitBtn text={"Assign bike"} handleSubmit={handleAssignBike} />
    </form>
  );
}

export default AssignForm;
