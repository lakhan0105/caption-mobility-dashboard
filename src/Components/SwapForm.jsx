import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import SubmitBtn from "./Buttons/SubmitBtn";
import { closeModal } from "../features/modal/modalSlice";
import { IoClose } from "react-icons/io5";

import {
  getAvailableBatteries,
  getBatteryById,
  swapBattery,
} from "../features/battery/batterySlice";

import Select from "react-select";
import { getActiveUsers } from "../features/user/UserSlice";

function SwapForm({ userDetails, getUser }) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!userDetails) {
      dispatch(getActiveUsers());
    }
    dispatch(getAvailableBatteries());
    console.log(userDetails);
  }, []);

  // get the list of available batteries
  const { availableBatteries, isLoading, swapLoading } = useSelector(
    (state) => state.batteryReducer
  );

  // get the list of active users
  const { activeUsers, isUserLoading } = useSelector(
    (state) => state.userReducer
  );

  const [selectedBattery, setSelectedBattery] = useState();
  const [selectedUser, setSelectedUser] = useState(userDetails?.$id || null);
  const [oldBatteryDetails, setOldBatteryDetails] = useState();

  const [options, setOptions] = useState([]);
  const [batteryOptions, setBatteryOptions] = useState();
  const [swapCount, setSwapCount] = useState();

  // set the options
  useEffect(() => {
    // options for active users
    setOptions(
      activeUsers?.map((user) => {
        const { $id, userName, batteryId, totalSwapCount } = user;
        return {
          value: $id,
          $id,
          label: userName,
          batteryId,
          userName,
          totalSwapCount,
        };
      })
    );

    // options for available batteries
    setBatteryOptions(
      availableBatteries?.map((battery) => {
        const { $id, batRegNum } = battery;
        return { value: $id, $id, label: batRegNum, batRegNum };
      })
    );
  }, [activeUsers]);

  // get and set the swap count of the user or the selected user
  useEffect(() => {
    if (userDetails) {
      setSwapCount(userDetails?.totalSwapCount);
    } else if (selectedUser) {
      setSwapCount(selectedUser?.totalSwapCount);
    }
  }, [userDetails, selectedUser]);

  // handleSwap
  async function handleSwap(e) {
    e.preventDefault();

    const userId = userDetails?.$id || selectedUser?.$id;
    const userName = userDetails?.userName || selectedUser?.userName;
    const oldBatteryId = userDetails?.batteryId || oldBatteryDetails?.$id;
    const newBatteryId = selectedBattery?.$id;
    const newBatRegNum = selectedBattery?.batRegNum;
    const oldBatRegNum = oldBatteryDetails?.batRegNum;
    const totalSwapCount = swapCount;

    console.log(totalSwapCount);

    try {
      await dispatch(
        swapBattery({
          userId,
          userName,
          oldBatteryId,
          newBatteryId,
          oldBatRegNum,
          newBatRegNum,
          totalSwapCount,
        })
      ).unwrap();

      dispatch(closeModal());
      if (userDetails) {
        getUser();
      }
    } catch (error) {
      console.log("swap failed:", error);
    }
  }

  function handleOldBatteryDetails(batteryId) {
    if (batteryId) {
      dispatch(getBatteryById(batteryId))
        .unwrap()
        .then((battery) => {
          setOldBatteryDetails(battery);
        })
        .catch((error) => {
          console.log("failed to fetch the battery details by id", error);
        });
    } else {
      setOldBatteryDetails(null);
    }
  }

  useEffect(() => {
    if (userDetails) {
      handleOldBatteryDetails(userDetails?.batteryId);
    }
  }, []);

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
        className="absolute right-4 top-4 cursor-pointer text-2xl"
        onClick={() => {
          dispatch(closeModal());
        }}
      >
        <IoClose />
      </button>

      <h3 className="font-semibold text-xl mb-5">SWAP BATTERY</h3>

      {/* SELECT USER */}
      {/* show this only when the userDetails is not passed as props */}
      {/* this el can only be shown anywhere except the userDetails page */}
      {!userDetails && (
        <div className="leading-loose">
          <label htmlFor="bike">Select user</label>

          <Select
            options={options}
            value={options?.find(
              (option) => option.value === selectedUser?.$id
            )}
            onChange={(user) => {
              // grab the batteryId from the selected input
              const { batteryId } = user;
              if (user) {
                setSelectedUser(() => {
                  return user;
                });
              }

              // run the getBatteryById only when the batteryId is present or else the swapForm component re-renders and the selected user also resets
              if (batteryId) {
                handleOldBatteryDetails(batteryId);
              }
            }}
          />
        </div>
      )}

      {/* if userDetails is passed show the name of that user in swapform */}
      {userDetails && <h3 className="font-medium">{userDetails?.userName}</h3>}

      {/* SELECT INPUT FOR BATTERY  */}
      <div className="leading-loose">
        <label htmlFor="bike">Select Battery</label>
        <Select
          options={batteryOptions}
          onChange={(battery) => {
            setSelectedBattery(battery);
          }}
        />
      </div>

      <SubmitBtn
        text={"Swap Battery"}
        handleSubmit={handleSwap}
        disabled={!selectedBattery || !selectedUser || isLoading}
      />
    </form>
  );
}

export default SwapForm;
