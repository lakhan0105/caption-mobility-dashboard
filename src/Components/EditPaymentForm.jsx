import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { closeModal } from "../features/modal/modalSlice";
import InputRow from "./InputRow";
import SubmitBtn from "./Buttons/SubmitBtn";
import { databases } from "../appwrite";
import { ID } from "appwrite";
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

  const [utrInputs, setUtrInputs] = useState({
    depositUtr: "",
    paidUtr: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserPayments();
    }
  }, [userId]);

  const fetchUserPayments = async () => {
    try {
      setPaymentData((prev) => ({ ...prev, loading: true }));

      // Fetch from usersCollId
      const response = await databases.getDocument(dbId, usersCollId, userId);
      const { depositAmount = 0, paidAmount = 0, pendingAmount = 0 } = response;

      const calculatedData = {
        depositAmount: parseInt(depositAmount) || 0,
        paidAmount: parseInt(paidAmount) || 0,
        pendingAmount: parseInt(pendingAmount) || 0,
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

  function handleUtrChange(e) {
    const { name, value } = e.target;
    setUtrInputs((prev) => ({ ...prev, [name]: value }));
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

    if (
      (paymentMethods.depositMethod === "online" &&
        newAmountDetails.depositAmount > 0 &&
        !utrInputs.depositUtr.trim()) ||
      (paymentMethods.paidMethod === "online" &&
        newAmountDetails.paidAmount > 0 &&
        !utrInputs.paidUtr.trim())
    ) {
      toast.error("UTR is required for online payments");
      return;
    }

    try {
      setLoading(true);

      const currentDate = new Date().toISOString();

      // Update usersCollId with new amounts
      await databases.updateDocument(dbId, usersCollId, userId, {
        depositAmount: parseInt(newAmountDetails.depositAmount) || 0,
        paidAmount: parseInt(newAmountDetails.paidAmount) || 0,
        pendingAmount: parseInt(newAmountDetails.pendingAmount) || 0,
      });

      // Log changes to paymentRecordsCollId
      if (newAmountDetails.depositAmount !== paymentData.depositAmount) {
        await databases.createDocument(
          dbId,
          paymentRecordsCollId,
          ID.unique(),
          {
            userId,
            amount: Math.abs(
              newAmountDetails.depositAmount - paymentData.depositAmount
            ),
            type: "deposit",
            method: paymentMethods.depositMethod,
            utrNumber:
              paymentMethods.depositMethod === "online"
                ? utrInputs.depositUtr.trim()
                : null,
            date: currentDate,
          }
        );
      }

      if (newAmountDetails.paidAmount !== paymentData.paidAmount) {
        await databases.createDocument(
          dbId,
          paymentRecordsCollId,
          ID.unique(),
          {
            userId,
            amount: Math.abs(
              newAmountDetails.paidAmount - paymentData.paidAmount
            ),
            type: "rent_collection",
            method: paymentMethods.paidMethod,
            utrNumber:
              paymentMethods.paidMethod === "online"
                ? utrInputs.paidUtr.trim()
                : null,
            date: currentDate,
          }
        );
      }

      if (newAmountDetails.pendingAmount !== paymentData.pendingAmount) {
        await databases.createDocument(
          dbId,
          paymentRecordsCollId,
          ID.unique(),
          {
            userId,
            amount: Math.abs(
              newAmountDetails.pendingAmount - paymentData.pendingAmount
            ),
            type: "pending",
            method: "cash",
            utrNumber: null,
            date: currentDate,
          }
        );
      }

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
      setLoading(false);
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
        {paymentMethods.depositMethod === "online" && (
          <div className="mt-2">
            <label htmlFor="depositUtr" className="text-sm text-gray-600 block">
              UTR / Reference Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="depositUtr"
              id="depositUtr"
              value={utrInputs.depositUtr}
              onChange={handleUtrChange}
              placeholder="e.g. 123456789012"
              className="border rounded text-sm block w-full mt-1 p-2"
            />
          </div>
        )}
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
        {paymentMethods.paidMethod === "online" && (
          <div className="mt-2">
            <label htmlFor="paidUtr" className="text-sm text-gray-600 block">
              UTR / Reference Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="paidUtr"
              id="paidUtr"
              value={utrInputs.paidUtr}
              onChange={handleUtrChange}
              placeholder="e.g. 123456789012"
              className="border rounded text-sm block w-full mt-1 p-2"
            />
          </div>
        )}
      </div>

      <div>
        <InputRow
          name={"pendingAmount"}
          type={"number"}
          label={"Edit pending payment"}
          value={newAmountDetails.pendingAmount}
          handleChange={handleChange}
        />
        <p className="text-xs text-gray-500 mt-1">
          This is the amount paid at the beginning
        </p>
      </div>

      <SubmitBtn
        text={"Update Payment"}
        handleSubmit={handleEdit}
        loading={loading}
      />
    </div>
  );
}

export default EditPaymentForm;
