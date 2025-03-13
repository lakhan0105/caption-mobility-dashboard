import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import SubmitBtn from "./Buttons/SubmitBtn";
import { closeModal } from "../features/modal/modalSlice";
import {
  getAvailableBatteries,
  swapBattery,
} from "../features/battery/batterySlice";

function SwapForm({ userDetails, getUser }) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getAvailableBatteries());
  }, []);

  // get the list of available batteries
  const { availableBatteries, isLoading, swapLoading } = useSelector(
    (state) => state.batteryReducer
  );

  const [selectedBatteryId, setSelectedBatteryId] = useState();

  // handleChange
  function handleChange(e) {
    const value = e.target.value;
    setSelectedBatteryId(value);
  }

  // handleSwap
  async function handleSwap(e) {
    e.preventDefault();

    try {
      await dispatch(
        swapBattery({
          userId: userDetails.$id,
          oldBatteryId: userDetails?.batteryId,
          newBatteryId: selectedBatteryId,
        })
      ).unwrap();

      dispatch(closeModal());
      getUser();
    } catch (error) {
      console.log("swap failed:", error);
    }
  }

  if (isLoading) {
    return <h2 className="bg-white rounded p-2 text-sm">Loading...</h2>;
  }

  if (swapLoading) {
    return <h2 className="bg-white rounded p-2 text-sm">Swap in process..</h2>;
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

      <h3 className="font-semibold text-xl mb-5">SWAP BATTERY</h3>

      {/* SELECT INPUT FOR BATTERY  */}
      <label htmlFor="bike">Select Battery</label>
      <select
        name="selectedBatteryId"
        id="battery"
        className="border rounded text-sm"
        onChange={handleChange}
        value={selectedBatteryId || ""}
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

      <SubmitBtn text={"Swap Battery"} handleSubmit={handleSwap} />
    </form>
  );
}

export default SwapForm;
