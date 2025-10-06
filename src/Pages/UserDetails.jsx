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
import toast from "react-hot-toast"; // For toasts

const userBucketId = import.meta.env.VITE_USER_BUCKET_ID;
const dbId = import.meta.env.VITE_DB_ID;
const usersCollId = import.meta.env.VITE_USERS_COLL_ID;
const bikesCollId = import.meta.env.VITE_BIKES_COLL_ID;

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

  // New: Calculate due amounts for alert
  async function calculateDueAmounts() {
    if (!userDetails?.bikeId) return { pending: 0, rent: 0 };

    try {
      const user = await databases.getDocument(
        dbId,
        usersCollId,
        userDetails.$id
      );
      const bike = await databases.getDocument(
        dbId,
        bikesCollId,
        userDetails.bikeId
      );

      const pending = parseInt(user.pendingAmount || 0);
      let rentDue = 0;
      const DAILY_RATE = 1700 / 7;

      if (user.lastRentCollectionDate && bike.assignedAt) {
        const lastPaymentDate = new Date(user.lastRentCollectionDate);
        const currentDate = new Date();
        const timeDiff = currentDate - lastPaymentDate;
        const daysSinceLast = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        rentDue = Math.round(DAILY_RATE * daysSinceLast);
      }

      return { pending, rent: rentDue };
    } catch (error) {
      console.error("Error calculating dues:", error);
      return { pending: 0, rent: 0 };
    }
  }

  // Updated: handleReturnBike with alert
  async function handleReturnBike() {
    const dues = await calculateDueAmounts();

    if (dues.pending > 0 || dues.rent > 0) {
      // Show alert/prompt
      const totalDue = dues.pending + dues.rent;
      const daysSinceLast = Math.floor(
        (new Date() -
          new Date(
            userDetails.lastRentCollectionDate ||
              userDetails.assignedAt ||
              new Date()
          )) /
          (1000 * 60 * 60 * 24)
      );
      const confirmMsg = `⚠️ Outstanding amounts before return:\n\n- Pending: ₹${
        dues.pending
      }\n- Rent Due: ₹${dues.rent} (${DAILY_RATE.toFixed(
        2
      )}/day for ${daysSinceLast} days)\n\nTotal: ₹${totalDue}\n\nPlease collect via Payments screen to avoid delays. Proceed without collecting?`;

      if (confirm(confirmMsg)) {
        // User chose to proceed—dispatch return
        proceedWithReturn();
      } else {
        // User cancels—remind and optionally redirect
        toast.info("Collections can be done via the Payments screen anytime.");
        // Optional: Redirect to Payments (uncomment if wanted)
        // window.location.href = '/payments?company=' + encodeURIComponent(userDetails.userCompany);
      }
    } else {
      // No dues—proceed directly
      proceedWithReturn();
    }
  }

  // New: Helper to proceed with return (keeps dispatch clean)
  function proceedWithReturn() {
    dispatch(
      returnBikeFromUser({
        userId: userDetails?.$id,
        bikeId: userDetails?.bikeId,
        batteryId: userDetails?.batteryId || null,
        totalSwapCount: userDetails?.totalSwapCount || 0,
      })
    )
      .unwrap()
      .then((result) => {
        toast.success(
          `Bike returned successfully! Payment cycle ended. (Final rent calc: ₹${result.finalRentDue} for ${result.daysSinceLast} days)`
        );
        getUser(); // Refresh user details
      })
      .catch((error) => {
        console.log("error while returning bike", error);
        toast.error("Failed to return bike.");
      });
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
