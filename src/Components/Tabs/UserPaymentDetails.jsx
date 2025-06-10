import React from "react";
import InfoCardOne from "../InfoCardOne";

import { MdOutlinePayment } from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";

import {
  showEditPaymentModal,
  showModal,
} from "../../features/modal/modalSlice";
import InfoCardRow from "../InfoCardRow";

function UserPaymentDetails({ pendingAmount, paidAmount, depositAmount }) {
  const dispatch = useDispatch();

  // show the modal to edit the payment details
  function showEditModal() {
    dispatch(showModal());
    dispatch(showEditPaymentModal());
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
        <InfoCardRow heading={"deposit amount"} value={`₹ ${depositAmount}`} />

        {/* Render paid amount */}
        <InfoCardRow heading={"paid amount"} value={`₹ ${paidAmount}`} />

        {/* Render PENDING AMOUNT */}
        <InfoCardRow heading={"pending amount"} value={`₹ ${pendingAmount}`} />
      </InfoCardOne>
    </>
  );
}

export default UserPaymentDetails;
