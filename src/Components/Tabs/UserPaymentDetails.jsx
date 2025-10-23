import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import InfoCardOne from "../InfoCardOne";
import { MdOutlinePayment } from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { databases } from "../../appwrite";
import {
  showEditPaymentModal,
  showModal,
} from "../../features/modal/modalSlice";
import InfoCardRow from "../InfoCardRow";
import { Query } from "appwrite";

const UserPaymentDetails = forwardRef(({ userId }, ref) => {
  const dispatch = useDispatch();
  const [paymentData, setPaymentData] = useState({
    depositAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    loading: true,
  });
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const dbId = import.meta.env.VITE_DB_ID;
  const usersCollId = import.meta.env.VITE_USERS_COLL_ID;
  const paymentRecordsCollId = import.meta.env.VITE_PAYMENT_RECORDS_COLL_ID;

  const fetchUserPayments = async () => {
    try {
      setPaymentData((prev) => ({ ...prev, loading: true }));
      setHistoryLoading(true);

      // Fetch user data
      const response = await databases.getDocument(dbId, usersCollId, userId);
      const { depositAmount = 0, paidAmount = 0, pendingAmount = 0 } = response;

      setPaymentData({
        depositAmount,
        paidAmount,
        pendingAmount,
        loading: false,
      });

      // Fetch payment history
      const historyRes = await databases.listDocuments(
        dbId,
        paymentRecordsCollId,
        [
          Query.equal("userId", userId),
          Query.orderDesc("$createdAt"),
          Query.limit(50), // Limit to recent 50 for performance
        ]
      );
      setHistory(historyRes.documents);
      setHistoryLoading(false);
    } catch (error) {
      console.error("Error fetching user payments:", error);
      setPaymentData({
        depositAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        loading: false,
      });
      setHistory([]);
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserPayments();
    }
  }, [userId]);

  useImperativeHandle(ref, () => ({
    refreshPayments: fetchUserPayments,
  }));

  function showEditModal() {
    dispatch(showModal());
    dispatch(showEditPaymentModal());
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
      headingIcon={<MdOutlinePayment />}
      heading={"payment details"}
      cardBtnName={"edit"}
      cardBtnIcon={<FaRegEdit />}
      cardExtraStyles={
        "border-[1.45px] border-red-400/50 font-semibold text-red-500 text-xs capitalize"
      }
      handleCardBtn={showEditModal}
    >
      <InfoCardRow
        heading={"deposit amount"}
        value={`₹ ${paymentData.depositAmount}`}
      />
      <InfoCardRow
        heading={"paid amount"}
        value={`₹ ${paymentData.paidAmount}`}
      />
      <InfoCardRow
        heading={"pending amount"}
        value={`₹ ${paymentData.pendingAmount}`}
      />
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Payment History
        </h4>
        {historyLoading ? (
          <p className="text-center text-gray-500">Loading history...</p>
        ) : history.length === 0 ? (
          <p className="text-center text-gray-500">No payment history</p>
        ) : (
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {history.map((record) => (
              <li
                key={record.$id}
                className="text-xs text-gray-600 border-b pb-1"
              >
                <div>
                  {formatDate(record.date)} - ₹{record.amount} ({record.type})
                  via {record.method}
                </div>
                {record.utrNumber && (
                  <div className="text-xs text-blue-600 font-medium mt-1">
                    UTR: {record.utrNumber}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </InfoCardOne>
  );
});

UserPaymentDetails.displayName = "UserPaymentDetails";

export default UserPaymentDetails;
