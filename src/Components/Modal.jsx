import React, { useEffect, useState } from "react";

import { PiUserCircleThin } from "react-icons/pi";
import { MdOutlineMailOutline } from "react-icons/md";
import { MdOutlineLocalPhone } from "react-icons/md";
import { MdOutlineLocationCity } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "../features/modal/modalSlice";
import { getUserProfile } from "../features/user/UserSlice";

function Modal() {
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
    if (modalStatus) {
      dispatch(getUserProfile(userId));
    }
  }, [userId, modalStatus]);

  return (
    <>
      {modalStatus && (
        <div className="fixed bg-black bg-opacity-50 top-0 bottom-0 right-0 left-0 z-50 grid place-items-center">
          <article className="w-[450px] min-h-[500px] bg-white rounded-xl px-4">
            {isUserLoading ? (
              <h2 className="text-center mt-20">Loading...</h2>
            ) : (
              <>
                {/* top */}
                <div className="border-b py-10 text-center relative">
                  <button
                    className="absolute top-4 right-0"
                    onClick={handleCloseModal}
                  >
                    close
                  </button>

                  <div className="text-8xl flex justify-center mb-2">
                    <PiUserCircleThin />
                  </div>
                  <h3 className="text-2xl font-semibold text-indigo-900 mb-6">
                    {userProfile?.userName}
                  </h3>
                  <button className="bg-indigo-900 hover:bg-indigo-800 text-white py-2 px-6 rounded-md text-sm">
                    Direction
                  </button>
                </div>

                {/* bottom */}
                <ul className="py-8 px-2">
                  <li className="flex items-center gap-3 mb-4">
                    <span className="text-xl">
                      <MdOutlineMailOutline />
                    </span>
                    <p className="text-sm">{userProfile?.userEmail}</p>
                  </li>

                  <li className="flex items-center gap-3 mb-4">
                    <span className="text-xl">
                      <MdOutlineLocalPhone />
                    </span>
                    <p className="text-sm">{userProfile?.userPhone}</p>
                  </li>

                  <li className="flex items-start gap-3 mb-4">
                    <span className="text-xl">
                      <MdOutlineLocationCity />
                    </span>
                    <p className="text-sm">
                      Mahadevapura, bengaluru Lorem ipsum dolor sit amet
                      consectetur adipisicing elit. Deserunt, adipisci?
                    </p>
                  </li>
                </ul>
              </>
            )}
          </article>
        </div>
      )}
    </>
  );
}

export default Modal;
