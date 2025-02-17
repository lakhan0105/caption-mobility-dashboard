import React from "react";
import { useDispatch } from "react-redux";
import { getUserProfile } from "../features/user/UserSlice";
import { setUserId, showModal } from "../features/modal/modalSlice";

function ViewBtn({ id }) {
  const dispatch = useDispatch();

  // handleViewBtn
  function handleViewBtn() {
    dispatch(showModal());
    dispatch(setUserId(id));
  }

  return (
    <button
      className="border px-2 py-0.5 rounded bg-green-600 hover:bg-green-700 text-white text-xs"
      onClick={handleViewBtn}
    >
      view
    </button>
  );
}

export default ViewBtn;
