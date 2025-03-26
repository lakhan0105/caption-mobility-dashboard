import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { closeModal } from "../features/modal/modalSlice";
import InputRow from "./InputRow";
import SubmitBtn from "./Buttons/SubmitBtn";
import { updatePendingAmount } from "../features/user/UserSlice";
import toast from "react-hot-toast";

function EditPaymentForm({ userId, pendingAmount, getUser }) {
  const dispatch = useDispatch();

  const [newPendingAmount, setNewPendingAmount] = useState(pendingAmount);

  async function handleEdit() {
    // check if an invalid input is provided in payment input
    if (newPendingAmount === "" || newPendingAmount < 0) {
      toast.error("please enter a valid number!");
      return;
    }

    try {
      await dispatch(
        updatePendingAmount({ userId, newPendingAmount })
      ).unwrap();
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

      <InputRow
        name={"pendingPayment"}
        type={"number"}
        label={"Edit pending payment"}
        value={newPendingAmount}
        handleChange={(e) => {
          const value = e.target.value;

          // allows us to remove the 0 from the number input
          if (value === "") {
            setNewPendingAmount(value);
          } else {
            setNewPendingAmount(Number(value));
          }
        }}
      />

      <SubmitBtn text={"Update"} handleSubmit={handleEdit} />
    </div>
  );
}

export default EditPaymentForm;
