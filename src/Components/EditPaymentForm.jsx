import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { closeModal } from "../features/modal/modalSlice";
import InputRow from "./InputRow";
import SubmitBtn from "./Buttons/SubmitBtn";
import { updatePayment } from "../features/user/UserSlice";
import toast from "react-hot-toast";

function EditPaymentForm({
  userId,
  depositAmount,
  paidAmount,
  pendingAmount,
  getUser,
}) {
  const dispatch = useDispatch();

  const [newAmountDetails, setNewAmountDetails] = useState({
    depositAmount,
    pendingAmount,
    paidAmount,
  });

  // handleChange
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

  async function handleEdit() {
    // check if an invalid input is provided in payment input
    if (
      newAmountDetails?.pendingAmount === "" ||
      newAmountDetails?.paidAmount < 0
    ) {
      toast.error("please enter a valid number!");
      return;
    }

    const data = {
      pendingAmount: newAmountDetails?.pendingAmount,
      depositAmount: newAmountDetails?.depositAmount,
      paidAmount: newAmountDetails?.paidAmount,
    };

    try {
      await dispatch(updatePayment({ userId, data })).unwrap();
      getUser();
      dispatch(closeModal());
    } catch (error) {
      console.log("error in updating the pending payment", error);
    }
  }

  return (
    <div className="bg-white w-full max-w-[400px] px-10 py-10 pt-14 rounded flex flex-col gap-4 relative ">
      {/* CLOSE MODAL BUTTON */}
      <button
        className="absolute right-4 top-4 cursor-pointer"
        onClick={() => {
          dispatch(closeModal());
        }}
      >
        close
      </button>

      {/* EDIT DEPOSIT AMOUNT */}
      <InputRow
        name={"depositAmount"}
        type={"number"}
        label={"Edit deposit amount"}
        value={newAmountDetails.depositAmount}
        handleChange={handleChange}
      />

      {/* EDIT PAID AMOUNT */}
      <InputRow
        name={"paidAmount"}
        type={"number"}
        label={"Edit paid amount"}
        value={newAmountDetails.paidAmount}
        handleChange={handleChange}
      />

      {/* EDIT PENDING AMOUNT */}
      <InputRow
        name={"pendingAmount"}
        type={"number"}
        label={"Edit pending payment"}
        value={newAmountDetails.pendingAmount}
        handleChange={handleChange}
      />

      <SubmitBtn text={"Update"} handleSubmit={handleEdit} />
    </div>
  );
}

export default EditPaymentForm;
