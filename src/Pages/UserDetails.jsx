import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router";
import { FaPhoneAlt } from "react-icons/fa";
import { FaRegMessage } from "react-icons/fa6";
import { databases, storage } from "../appwrite";
import SimpleBtn from "../Components/Buttons/SimpleBtn";
import { AssignForm, EditPaymentForm, Modal, SwapForm } from "../Components";
import { useDispatch, useSelector } from "react-redux";
import { returnBikeFromUser } from "../features/user/UserSlice";
import Tabs from "../Components/Tabs/Tabs";
import { Avatar } from "@mui/material";
import { deepPurple } from "@mui/material/colors";
import UserPhoto from "../Components/UserPhoto";

const userBucketId = import.meta.env.VITE_USER_BUCKET_ID;
const dbId = import.meta.env.VITE_DB_ID;
const usersCollId = import.meta.env.VITE_USERS_COLL_ID;

function UserDetails() {
  const param = useParams();
  const paramId = param.id;
  const [userDetails, setUserDetails] = useState();
  const paymentDetailsRef = useRef(null);

  const dispatch = useDispatch();

  const { isAssignForm, isSwapForm, isPendingPayment, isLoading } = useSelector(
    (state) => {
      return state.modalReducer;
    }
  );

  async function getUser() {
    try {
      const response = await databases.getDocument(dbId, usersCollId, paramId);
      if (response) {
        setUserDetails(() => response);
      }
      console.log(response);
    } catch (error) {
      alert("error while getting the user details");
      console.log(error);
    }
  }

  useEffect(() => {
    getUser();
  }, [paramId]);

  function handleReturnBike() {
    dispatch(
      returnBikeFromUser({
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
    const { $id, userName, userRegisterId, isBlocked, userNotes, userPhotoId } =
      userDetails;

    const userPhotoUrl = storage.getFilePreview(userBucketId, userPhotoId);

    console.log(userPhotoUrl);

    return (
      <section className="w-full max-w-[900px] md:ml-[300px] md:w-[calc(100%-300px)]">
        <div className="">
          <div className="flex items-center gap-8 pt-14 pb-10 bg-gradient-to-r from-[#39434d] to-[#252c37] px-5 text-white">
            <UserPhoto fileId={userPhotoId} />
            <div className="mt-0">
              <h2 className="text-2xl font-semibold">{userName}</h2>
              <p className="text-xs font-medium text-zinc-500 mt-1.5">
                {userRegisterId}
              </p>
              <div className="mt-2.5">
                <div className="flex items-center gap-3">
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
                    name={"message"}
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

          <Tabs
            userDetails={userDetails}
            handleReturnBike={handleReturnBike}
            paymentDetailsRef={paymentDetailsRef}
          />

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
                onPaymentUpdated={() =>
                  paymentDetailsRef.current?.refreshPayments()
                }
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
