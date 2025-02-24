import React, { useEffect, useState } from "react";

import { PiUserCircleThin } from "react-icons/pi";
import { MdOutlineMailOutline } from "react-icons/md";
import { MdOutlineLocalPhone } from "react-icons/md";
import { MdOutlineLocationCity } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "../features/modal/modalSlice";
import { getUserProfile } from "../features/user/UserSlice";

function Modal({ children }) {
  const { modalStatus, userId } = useSelector((state) => state.modalReducer);
  const { userProfile, isUserLoading } = useSelector(
    (state) => state.userReducer
  );
  const dispatch = useDispatch();

  // handleCloseModal
  function handleCloseModal() {
    dispatch(closeModal());
  }

  // run the useeffect as soon as the userId in modalSlice changes
  useEffect(() => {
    // if (modalStatus) {
    //   // dispatch(getUserProfile(userId));
    // }
  }, [userId, modalStatus]);

  return (
    <>
      {modalStatus && (
        <div className="fixed bg-black bg-opacity-50 top-0 bottom-0 right-0 left-0 z-50 grid place-items-center">
          {children}
        </div>
      )}
    </>
  );
}

export default Modal;
