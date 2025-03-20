import React from "react";
import InfoCardOne from "../InfoCardOne";

import { MdOutlinePayment } from "react-icons/md";
import SimpleBtn from "../Buttons/SimpleBtn";
import InfoCardRowTwo from "../InfoCardRowTwo";
import { FaRegEdit } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";

import {
  showEditPaymentModal,
  showModal,
} from "../../features/modal/modalSlice";

function UserPaymentDetails({ pendingAmount }) {
  const dispatch = useDispatch();

  // show the modal to edit the payment details
  function shoeEditModal() {
    dispatch(showModal());
    dispatch(showEditPaymentModal());
  }

  return (
    <InfoCardOne headingIcon={<MdOutlinePayment />} heading={"payment details"}>
      {/* PENDING AMOUNT */}
      <InfoCardRowTwo heading={"pending amount"} value={`₹ ${pendingAmount}`}>
        {/* BUTTON TO EDIT THE PENDING AMOUNT */}
        <SimpleBtn
          name={"Edit"}
          icon={<FaRegEdit />}
          extraStyles={
            "border-[1.45px] border-red-400/50 font-semibold text-red-500 text-xs"
          }
          handleBtn={shoeEditModal}
        />
      </InfoCardRowTwo>
    </InfoCardOne>
  );
}

export default UserPaymentDetails;
