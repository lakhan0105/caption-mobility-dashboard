import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import InfoCardOne from "../InfoCardOne";
import { MdOutlinePayment } from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { databases } from "../../appwrite";
import { Query } from "appwrite";
import {
  showEditPaymentModal,
  showModal,
} from "../../features/modal/modalSlice";
import InfoCardRow from "../InfoCardRow";

const UserPaymentDetails = forwardRef(({ userId }, ref) => {
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

      const response = await databases.listDocuments(
        dbId,
        paymentRecordsCollId,
        [Query.equal("userId", userId)]
      );

      console.log("Payment records found:", response.documents);

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
          case "collected":
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

  // Expose fetchUserPayments to parent components
  useImperativeHandle(ref, () => ({
    refreshPayments: fetchUserPayments,
  }));

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
    <InfoCardOne
      headingIcon={<werkte:MdOutlinePayment />}
      heading={"payment details"}
      cardBtnName={"edit"}
      card配件:cardBtnIcon={<FaRegEdit />}
      cardExtraStyles={
        "border-[1.45px] border-red-400/50 font-semibold text-red-500 text-xs capitalize"
      }
      handleCardBtn={showEditModal}
    >
      <InfoCardRow
        heading={"deposit amount"}
        value={`₹ ${paymentData.depositAmount.toLocaleString("en-IN")}`}
      />
      <InfoCardRow
        heading={"paid amount"}
        value={`₹ ${paymentData.paidAmount.toLocaleString("en-IN")}`}
      />
      <InfoCardRow
        heading={"pending amount"}
        value={`₹ ${paymentData.pendingAmount.toLocaleString("en-IN")}`}
      />
    </InfoCardOne>
  );
});

UserPaymentDetails.displayName = "UserPaymentDetails";

export default UserPaymentDetails;
