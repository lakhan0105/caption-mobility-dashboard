import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { closeModal } from "../features/modal/modalSlice";
import InputRow from "./InputRow";
import SubmitBtn from "./Buttons/SubmitBtn";
import { databases } from "../appwrite";
import { Query, ID } from "appwrite";
import toast from "react-hot-toast";

function EditPaymentForm({
  userId,
  depositAmount,
  paidAmount,
  pendingAmount,
  getUser,
  onPaymentUpdated,
}) {
  const dispatch = useDispatch();
  const dbId = import.meta.env.VITE_DB_ID;
  const paymentRecordsCollId = import.meta.env.VITE_PAYMENT_RECORDS_COLL_ID;
  const usersCollId = import.meta.env.VITE_USERS_COLL_ID;

  const [paymentData, setPaymentData] = useState({
    depositAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    loading: true,
  });

  const [newAmountDetails, setNewAmountDetails] = useState({
    depositAmount: 0,
    pendingAmount: 0,
    paidAmount: 0,
  });

  const [paymentMethods, setPaymentMethods] = useState({
    depositMethod: "cash",
    paidMethod: "cash",
  });

  const [loading, setLoading] = useState(false); // Add loading state for button

  useEffect(() => {
    if (userId) {
      fetchUserPayments();
    }
  }, [userId]);

  const fetchUserPayments = async () => {
    try {
      setPaymentData((prev) => ({ ...prev, loading: true }));

      const response = await databases.listDocuments(
        dbId,
        paymentRecordsCollId,
        [Query.equal("userId", userId)]
      );

      let depositAmount = 0;
      let paidAmount = 0;
      let pendingAmount = 0;

      response.documents.forEach((payment) => {
        const amount = payment.amount || 0;

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
            break;
        }
      });

      const calculatedData = {
        depositAmount,
        paidAmount,
        pendingAmount,
        loading: false,
      };

      setPaymentData(calculatedData);
      setNewAmountDetails(calculatedData);
    } catch (error) {
      console.error("Error fetching user payments:", error);
      setPaymentData({
        depositAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        loading: false,
      });
      toast.error("Failed to load payment data");
    }
  };

  function handleChange(e) {
    const value = e.target.value;
    const key = e.target.name;

    setNewAmountDetails((prev) => {
      if (value === "") {
        return { ...prev, [key]: value };
      } else {
        return { ...prev, [key]: Number(value) };
      }
    });
  }

  function handleMethodChange(e) {
    const { name, value } = e.target;
    setPaymentMethods((prev) => ({ ...prev, [name]: value }));
  }

  async function handleEdit() {
    if (
      newAmountDetails?.pendingAmount === "" ||
      newAmountDetails?.paidAmount < 0 ||
      newAmountDetails?.depositAmount < 0
    ) {
      toast.error("Please enter valid amounts!");
      return;
    }

    try {
      setLoading(true); // Set loading to true when submission starts

      const currentDate = new Date().toISOString();

      const existingRecords = await databases.listDocuments(
        dbId,
        paymentRecordsCollId,
        [Query.equal("userId", userId)]
      );

      for (const record of existingRecords.documents) {
        await databases.deleteDocument(dbId, paymentRecordsCollId, record.$id);
      }

      if (newAmountDetails.depositAmount > 0) {
        await databases.createDocument(
          dbId,
          paymentRecordsCollId,
          ID.unique(),
          {
            userId,
            amount: newAmountDetails.depositAmount,
            type: "deposit",
            method: paymentMethods.depositMethod,
            date: currentDate,
          }
        );
      }

      if (newAmountDetails.paidAmount > 0) {
        await databases.createDocument(
          dbId,
          paymentRecordsCollId,
          ID.unique(),
          {
            userId,
            amount: newAmountDetails.paidAmount,
            type: "rent",
            method: paymentMethods.paidMethod,
            date: currentDate,
          }
        );
      }

      if (newAmountDetails.pendingAmount > 0) {
        await databases.createDocument(
          dbId,
          paymentRecordsCollId,
          ID.unique(),
          {
            userId,
            amount: newAmountDetails.pendingAmount,
            type: "pending",
            method: "cash",
            date: currentDate,
          }
        );
      }

      await databases.updateDocument(dbId, usersCollId, userId, {
        pendingAmount: parseInt(newAmountDetails.pendingAmount) || 0,
      });

      toast.success("Payment updated successfully!");

      if (onPaymentUpdated) {
        onPaymentUpdated();
      }

      getUser();
      dispatch(closeModal());
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Failed to update payment");
    } finally {
      setLoading(false); // Reset loading state when submission completes
    }
  }

  if (paymentData.loading) {
    return (
      <div className="bg-white w-full max-w-[400px] px-10 py-10 pt-14 rounded flex flex-col gap-4 relative">
        <button
          className="absolute right-4 top-4 cursor-pointer"
          onClick={() => dispatch(closeModal())}
        >
          close
        </button>
        <div className="text-center text-gray-600">Loading payment data...</div>
      </div>
    );
  }

  return (
    <div className="bg-white w-full max-w-[400px] px-10 py-10 pt-14 rounded flex flex-col gap-4 relative">
      <button
        className="absolute right-4 top-4 cursor-pointer"
        onClick={() => {
          dispatch(closeModal());
        }}
      >
        close
      </button>

      <div className="bg-gray-50 p-3 rounded-lg mb-2">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Current Amounts:
        </h3>
        <div className="text-xs space-y-1">
          <div>
            Deposit: ₹{paymentData.depositAmount.toLocaleString("en-IN")}
          </div>
          <div>Paid: ₹{paymentData.paidAmount.toLocaleString("en-IN")}</div>
          <div>
            Pending: ₹{paymentData.pendingAmount.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      <div>
        <InputRow
          name={"depositAmount"}
          type={"number"}
          label={"Edit deposit amount"}
          value={newAmountDetails.depositAmount}
          handleChange={handleChange}
        />
        <label htmlFor="depositMethod" className="text-sm text-gray-600">
          Deposit Payment Method
        </label>
        <select
          name="depositMethod"
          id="depositMethod"
          className="border rounded text-sm block w-full mt-1 p-2"
          onChange={handleMethodChange}
          value={paymentMethods.depositMethod}
        >
          <option value="cash">Cash</option>
          <option value="online">Online</option>
        </select>
      </div>

      <div>
        <InputRow
          name={"paidAmount"}
          type={"number"}
          label={"Edit paid amount"}
          value={newAmountDetails.paidAmount}
          handleChange={handleChange}
        />
        <label htmlFor="paidMethod" className="text-sm text-gray-600">
          Paid Payment Method
        </label>
        <select
          name="paidMethod"
          id="paidMethod"
          className="border rounded text-sm block w-full mt-1 p-2"
          onChange={handleMethodChange}
          value={paymentMethods.paidMethod}
        >
          <option value="cash">Cash</option>
          <option value="online">Online</option>
        </select>
      </div>

      <InputRow
        name={"pendingAmount"}
        type={"number"}
        label={"Edit pending payment"}
        value={newAmountDetails.pendingAmount}
        handleChange={handleChange}
      />

      <SubmitBtn
        text={"Update Payment"}
        handleSubmit={handleEdit}
        loading={loading} // Pass loading state to SubmitBtn
      />
    </div>
  );
}

export default EditPaymentForm;
