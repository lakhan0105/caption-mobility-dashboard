import React, { useEffect, useState } from "react";
import { useParams } from "react-router";

import { FaPhoneAlt } from "react-icons/fa";
import { FaRegMessage } from "react-icons/fa6";
import { databases } from "../appwrite";
import SimpleBtn from "../Components/Buttons/SimpleBtn";
import { AssignForm, EditPaymentForm, Modal, SwapForm } from "../Components";
import { useDispatch, useSelector } from "react-redux";
import { returnBikeFromUser } from "../features/user/UserSlice";
import Tabs from "../Components/Tabs/Tabs";
import { Avatar } from "@mui/material";
import { deepPurple } from "@mui/material/colors";

const dbId = import.meta.env.VITE_DB_ID;
const usersCollId = import.meta.env.VITE_USERS_COLL_ID;

function UserDetails() {
  const param = useParams();
  const paramId = param.id;
  const [userDetails, setUserDetails] = useState();

  const dispatch = useDispatch();

  const { isAssignForm, isSwapForm, isPendingPayment, isLoading } = useSelector(
    (state) => {
      return state.modalReducer;
    }
  );

  // function to fetch the user (single user)
  async function getUser() {
    try {
      const response = await databases.getDocument(dbId, usersCollId, paramId);
      if (response) {
        setUserDetails(() => response);
      }
      console.log(response);
    } catch (error) {
      alert("error while geting the user details");
      console.log(error);
    }
  }

  useEffect(() => {
    getUser();
  }, [paramId]);

  // function to return the bike
  // - removes the bikeId, userSatatus from the userData in appwrite
  // - changes bikeStatus to null from bikeData in appwrite
  function handleReturnBike() {
    // run the returnBikeFrmUser
    // - if successfull run the getUser() to refresh the data again
    dispatch(
      returnBikeFrmUser({
        userId: userDetails?.$id,
        bikeId: userDetails?.bikeId,
        batteryId: userDetails?.batteryId,
        totalSwapCount: 0,
      })
    )
      .unwrap()
      .then(() => {
        getUser();
      })
      .catch((error) => {
        console.log("error while returning bike", error);
      });
    getUser();
  }

  if (userDetails) {
    const { $id, userName, userRegisterId, isBlocked, userNotes } = userDetails;

    return (
      <section className="w-full max-w-[900px] md:ml-[300px] md:w-[calc(100%-300px)]">
        <div className="">
          {/* TOP CARD */}
          <div
            className="flex items-cente gap-8 pt-14 pb-10 bg-gradient-to-r from-[#39434d] to-[#252c37]
 px-5 text-white"
          >
            {/* PROFILE ICON */}
            <div className="text-[85px]">
              <Avatar
                sx={{
                  width: "85px",
                  height: "85px",
                  fontSize: "2.3rem",
                  bgcolor: deepPurple[400],
                }}
              >
                {userName[0].toUpperCase()}
              </Avatar>
            </div>

            {/* BASIC INFO */}
            <div className="mt-0">
              <h2 className="text-2xl font-semibold">{userName}</h2>
              <p className="text-xs font-medium tex-zinc-500 mt-1.5">
                {userRegisterId}
              </p>

              {/* BUTTONS TO CALL AND MESSAGE THE USER */}
              <div className="mt-2.5">
                <div className=" flex items-center gap-3">
                  <SimpleBtn
                    name={"call"}
                    icon={<FaPhoneAlt />}
                    extraStyles={
                      "capitalize text-xs border-white/30 rounded-2xl"
                    }
                    userPhone={userDetails?.userPhone}
                    action={"call"}
                  />

                  <SimpleBtn
                    name={"messsage"}
                    icon={<FaRegMessage />}
                    extraStyles={
                      "capitalize text-xs border-white/30 rounded-2xl"
                    }
                    userPhone={userDetails?.userPhone}
                    action={"message"}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* TABS */}
          <Tabs userDetails={userDetails} handleReturnBike={handleReturnBike} />

          {/* If bike is not assigned then show AssignForm or else show the swap form */}
          <Modal>
            {isAssignForm && (
              <AssignForm
                getUser={getUser}
                oldPendingAmount={userDetails?.pendingAmount}
              />
            )}

            {isSwapForm && (
              <SwapForm userDetails={userDetails} getUser={getUser} />
            )}

            {isPendingPayment && (
              <EditPaymentForm
                userId={paramId}
                depositAmount={userDetails?.depositAmount}
                paidAmount={userDetails?.paidAmount}
                pendingAmount={userDetails?.pendingAmount}
                getUser={getUser}
              />
            )}

            {isLoading && <h2 className="text-white">Loading...</h2>}
          </Modal>
        </div>
      </section>
    );
  }
}

export default UserDetails;
