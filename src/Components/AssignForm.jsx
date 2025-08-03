import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "../features/modal/modalSlice";
import { getAvailableBikes } from "../features/bike/bikeSlice";
import SubmitBtn from "./Buttons/SubmitBtn";

import { assignBikeToUser } from "../features/user/UserSlice";
import { getAvailableBatteries } from "../features/battery/batterySlice";
import InputRow from "./InputRow";
import toast from "react-hot-toast";
import { useParams } from "react-router";

function AssignForm({ getUser, oldPendingAmount }) {
  const dispatch = useDispatch();
  const { id: userId } = useParams();

  useEffect(() => {
    dispatch(getAvailableBikes());
    dispatch(getAvailableBatteries());
  }, [dispatch]);

  const { availableBikes, isBikeLoading } = useSelector(
    (state) => state.bikeReducer
  );
  const { availableBatteries, isBatteryLoading } = useSelector(
    (state) => state.batteryReducer
  );

  const [assignmentData, setAssignmentData] = useState({
    userId,
    selectedBikeId: null,
    selectedBatteryId: null,
    depositAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    chargerStatus: false,
    depositMethod: "cash", // New: Default payment method
    paidMethod: "cash", // New: Default payment method
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setAssignmentData((prev) => ({ ...prev, [name]: value }));
  }

  function handleAssignBike(e) {
    e.preventDefault();

    if (!assignmentData.selectedBikeId || !assignmentData.selectedBatteryId) {
      toast.error("Please fill all the details");
      return;
    }

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
      .catch((error) => {
        console.log("error in assigning a bike", error);
        toast.error("Failed to assign bike");
      });
  }

  if (isBikeLoading || isBatteryLoading) {
    return <h2>Loading...</h2>;
  }

  return (
    <form className="bg-white w-full max-w-[400px] px-10 py-10 pt-14 rounded flex flex-col gap-6 relative">
      <button
        className="absolute right-4 top-4 cursor-pointer"
        onClick={() => dispatch(closeModal())}
      >
        close
      </button>

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
          {availableBikes?.map((bike) => (
            <option value={bike.$id} key={bike.$id}>
              {bike.bikeRegNum}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="battery">Select Battery</label>
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
          {availableBatteries?.map((battery) => (
            <option value={battery.$id} key={battery.$id}>
              {battery.batRegNum}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <input
          type="checkbox"
          id="chargerStatus"
          checked={assignmentData.chargerStatus}
          onChange={() =>
            setAssignmentData((prev) => ({
              ...prev,
              chargerStatus: !prev.chargerStatus,
            }))
          }
        />
        <label htmlFor="chargerStatus">Charger provided</label>
      </div>

      <div>
        <InputRow
          name="depositAmount"
          type="number"
          label="Deposit Amount"
          handleChange={handleChange}
          value={assignmentData.depositAmount}
        />
        <label htmlFor="depositMethod">Deposit Payment Method</label>
        <select
          name="depositMethod"
          id="depositMethod"
          className="border rounded text-sm block w-full"
          onChange={handleChange}
          value={assignmentData.depositMethod}
        >
          <option value="cash">Cash</option>
          <option value="online">Online</option>
        </select>
      </div>

      <div>
        <InputRow
          name="paidAmount"
          type="number"
          label="Paid Amount"
          handleChange={handleChange}
          value={assignmentData.paidAmount}
        />
        <label htmlFor="paidMethod">Paid Payment Method</label>
        <select
          name="paidMethod"
          id="paidMethod"
          className="border rounded text-sm block w-full"
          onChange={handleChange}
          value={assignmentData.paidMethod}
        >
          <option value="cash">Cash</option>
          <option value="online">Online</option>
        </select>
      </div>

      <div>
        <InputRow
          name="pendingAmount"
          type="number"
          label="Pending Amount"
          handleChange={handleChange}
          value={assignmentData.pendingAmount}
        >
          <p className="text-xs text-red-500 font-medium mb-1">
            old pending amount: ₹ {oldPendingAmount}
          </p>
        </InputRow>
      </div>

      <SubmitBtn text="Assign Bike" handleSubmit={handleAssignBike} />
    </form>
  );
}

export default AssignForm;
