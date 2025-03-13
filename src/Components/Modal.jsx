import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "../features/modal/modalSlice";

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
        <div className="fixed bg-black bg-opacity-50 top-0 bottom-0 right-0 left-0 z-50 grid place-items-center backdrop-blur-sm">
          {children}
        </div>
      )}
    </>
  );
}

export default Modal;
