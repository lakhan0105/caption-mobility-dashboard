import { useState, useEffect } from "react";
import InfoCardOne from "../InfoCardOne";
import { MdOutlinePayment } from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { databases } from "../../appwrite"; // Adjust import path as needed
import { Query } from "appwrite";

import {
  showEditPaymentModal,
  showModal,
} from "../../features/modal/modalSlice";
import InfoCardRow from "../InfoCardRow";

function UserPaymentDetails({ userId }) {
  const dispatch = useDispatch();
  const [paymentData, setPaymentData] = useState({
    depositAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    loading: true,
  });

  const dbId = import.meta.env.VITE_DB_ID;
  const paymentRecordsCollId = import.meta.env.VITE_PAYMENT_RECORDS_COLL_ID;

  useEffect(() => {
    if (userId) {
      fetchUserPayments();
    }
  }, [userId]);

  const fetchUserPayments = async () => {
    try {
      setPaymentData((prev) => ({ ...prev, loading: true }));

      console.log("Fetching payments for userId:", userId);
      console.log("Using collection:", paymentRecordsCollId);

      // Get all payment records for this user
      const response = await databases.listDocuments(
        dbId,
        paymentRecordsCollId,
        [Query.equal("userId", userId)]
      );

      console.log("Payment records found:", response.documents);

      // Calculate amounts based on payment types
      let depositAmount = 0;
      let paidAmount = 0;
      let pendingAmount = 0;

      response.documents.forEach((payment) => {
        const amount = payment.amount || 0;
        console.log(`Payment: ${payment.type} - ₹${amount}`);

        switch (payment.type) {
          case "deposit":
            depositAmount += amount;
            break;
          case "rent":
            paidAmount += amount;
            break;
          case "pending":
            pendingAmount += amount;
            break;
          default:
            console.log("Unknown payment type:", payment.type);
            break;
        }
      });

      console.log("Calculated totals:", {
        depositAmount,
        paidAmount,
        pendingAmount,
      });

      setPaymentData({
        depositAmount,
        paidAmount,
        pendingAmount,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching user payments:", error);
      console.error("Error details:", error.message);
      setPaymentData({
        depositAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        loading: false,
      });
    }
  };

  // show the modal to edit the payment details
  function showEditModal() {
    dispatch(showModal());
    dispatch(showEditPaymentModal());
  }

  if (paymentData.loading) {
    return (
      <InfoCardOne
        headingIcon={<MdOutlinePayment />}
        heading={"payment details"}
        cardBtnName={"edit"}
        cardBtnIcon={<FaRegEdit />}
        cardExtraStyles={
          "border-[1.45px] border-red-400/50 font-semibold text-red-500 text-xs capitalize"
        }
        handleCardBtn={showEditModal}
      >
        <div className="p-4 text-center text-gray-500">
          Loading payment details...
        </div>
      </InfoCardOne>
    );
  }

  return (
    <>
      <InfoCardOne
        headingIcon={<MdOutlinePayment />}
        heading={"payment details"}
        cardBtnName={"edit"}
        cardBtnIcon={<FaRegEdit />}
        cardExtraStyles={
          "border-[1.45px] border-red-400/50 font-semibold text-red-500 text-xs capitalize"
        }
        handleCardBtn={showEditModal}
      >
        {/* Render deposit amount */}
        <InfoCardRow
          heading={"deposit amount"}
          value={`₹ ${paymentData.depositAmount.toLocaleString("en-IN")}`}
        />

        {/* Render paid amount */}
        <InfoCardRow
          heading={"paid amount"}
          value={`₹ ${paymentData.paidAmount.toLocaleString("en-IN")}`}
        />

        {/* Render PENDING AMOUNT */}
        <InfoCardRow
          heading={"pending amount"}
          value={`₹ ${paymentData.pendingAmount.toLocaleString("en-IN")}`}
        />
      </InfoCardOne>
    </>
  );
}

export default UserPaymentDetails;
