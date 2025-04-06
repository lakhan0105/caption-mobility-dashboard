import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import SubmitBtn from "./Buttons/SubmitBtn";
import { closeModal } from "../features/modal/modalSlice";
import { IoClose } from "react-icons/io5";
import { RiErrorWarningLine, RiH4 } from "react-icons/ri";

import {
  getAvailableBatteries,
  getBatteryById,
  swapBattery,
} from "../features/battery/batterySlice";

import { getActiveUsers } from "../features/user/UserSlice";
import ScannerComp from "./ScannerComp";
import toast from "react-hot-toast";

function SwapForm({ userDetails, getUser }) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!userDetails) {
      dispatch(getActiveUsers());
    }
    dispatch(getAvailableBatteries());
  }, []);

  // get the list of available batteries
  const { isLoading, swapLoading, batteryById } = useSelector(
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
  // useEffect(() => {
  //   // options for active users
  //   setOptions(
  //     activeUsers?.map((user) => {
  //       const {
  //         $id,
  //         userName,
  //         batteryId,
  //         totalSwapCount,
  //         pendingAmount,
  //         isBlocked,
  //         userNotes,
  //       } = user;
  //       return {
  //         value: $id,
  //         $id,
  //         label: userName,
  //         batteryId,
  //         userName,
  //         totalSwapCount,
  //         pendingAmount,
  //         isBlocked,
  //         userNotes,
  //       };
  //     })
  //   );

  //   // options for available batteries
  //   setBatteryOptions(
  //     availableBatteries?.map((battery) => {
  //       const { $id, batRegNum } = battery;
  //       return { value: $id, $id, label: batRegNum, batRegNum };
  //     })
  //   );
  // }, [activeUsers]);

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
    const totalSwapCount = swapCount; // from user data
    const isBlocked = userDetails?.isBlocked || selectedUser?.isBlocked;

    try {
      if (oldBatteryId === newBatteryId) {
        toast.error("cannot swap same batteries");
        return;
      }

      await dispatch(
        swapBattery({
          userId,
          userName,
          oldBatteryId,
          newBatteryId,
          oldBatRegNum,
          newBatRegNum,
          totalSwapCount,
          isBlocked,
        })
      ).unwrap();

      dispatch(closeModal());

      // if the swap form is in the userDetails page, then update his details
      if (userDetails) {
        getUser();
      }
    } catch (error) {
      console.log("swap failed:", error);
    }
  }

  function handleOldBatteryDetails(batteryId, user) {
    console.log("inside", batteryId);
    console.log(user);
    setSelectedUser(user);
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

  // handleScanNewBattery
  // - gets the battery details after scanning
  // - sets the batteryById state in batterySlice (it contains the battery information)
  // - we set the selectedBattery in this component to the battery details from batterySlice
  function handleScanNewBattery(newBatteryId) {
    dispatch(getBatteryById(newBatteryId))
      .unwrap()
      .then((batteryInfo) => {
        setSelectedBattery(batteryInfo);
      })
      .catch((err) => {
        console.log("Error fetching battery:", err);
        toast.error("Failed to scan new battery");
      });
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
          setSelectedBattery(null);
          setSelectedUser(null);
        }}
      >
        <IoClose />
      </button>

      <h3 className="font-semibold text-xl">SWAP BATTERY</h3>

      {/* SELECT USER */}
      {/* show this only when the userDetails is not passed as props */}
      {/* this el can only be shown anywhere except the userDetails page */}
      {!userDetails && (
        <div className="leading-loose">
          {/* show the pending amount from the selected user */}
          {selectedUser?.pendingAmount > 0 && (
            <div className="text-red-500 font-medium text-xs flex items-center gap-1 mb-5">
              <span className="text-[13px]">
                <RiErrorWarningLine />
              </span>
              <h4>pending amount: ₹{selectedUser?.pendingAmount}</h4>
            </div>
          )}

          {/* REASON FOR BLOCK (When userdetails are not passed, and swap is made from /swaps route)*/}
          {selectedUser?.isBlocked === true && (
            <h4 className="text-red-700 mb-3 text-[13px] leading-relaxed">
              This user is blocked because :{" "}
              <span className="underline">
                {userDetails?.userNotes || selectedUser?.userNotes}
              </span>
              <br />
              please contact caption mobility
            </h4>
          )}

          {/* AFTER SCAN, WE NEED 
          - user details who has that battery(setSelectedUser(userobj))
          - handleOldBatteryDetails(batteryId)  */}

          {/* HTML5 SCANNER COMPONENT (SCAN OLD BATTERY TO GET THE USER)*/}
          {selectedUser ? (
            <h2>Selected User : {selectedUser?.userRegisterId}</h2>
          ) : (
            <ScannerComp
              handleOldBatteryDetails={handleOldBatteryDetails}
              setSelectedUser={setSelectedUser}
            />
          )}
        </div>
      )}

      {/* WITH USER DETAILS */}
      {/* if userDetails is passed show the name of that user in swapform */}
      {userDetails && (
        <h3 className="font-medium capitalize text-zinc-600">
          {userDetails?.userName}
        </h3>
      )}

      <div className="leading-loose">
        {/* check and show the pending payment details of the user*/}
        {userDetails?.pendingAmount > 0 && (
          <div className="text-red-500 font-medium text-xs flex items-center gap-1 mb-5">
            <span className="text-[13px]">
              <RiErrorWarningLine />
            </span>
            <h4>pending amount: ₹{userDetails?.pendingAmount}</h4>
          </div>
        )}

        {/*  */}
        {/* BLOCK REASON (When the userDetails is passed, which means the swap is made from the user profile page) */}
        {userDetails?.isBlocked === true && (
          <h4 className="text-red-700 mb-3 text-[13px] leading-relaxed">
            This user is blocked because :{" "}
            <span className="underline">
              {userDetails?.userNotes || selectedUser?.userNotes}
            </span>
            <br />
            please contact caption mobility
          </h4>
        )}

        {/*  */}
        {/* SELECT BATTERY */}
        {/* do not show if the userDetails or selecetdUser isblocked
         */}
        {(userDetails?.isBlocked === false ||
          selectedUser?.isBlocked === false) && (
          <div>
            {selectedBattery ? (
              <h2>Selected Battery: {selectedBattery?.batRegNum}</h2>
            ) : (
              <ScannerComp
                scanNewBattery={true}
                handleScanNewBattery={handleScanNewBattery}
              />
            )}
          </div>
        )}
      </div>

      <SubmitBtn
        text={"Swap Battery"}
        handleSubmit={handleSwap}
        disabled={!selectedBattery || isLoading}
      />
    </form>
  );
}

export default SwapForm;
