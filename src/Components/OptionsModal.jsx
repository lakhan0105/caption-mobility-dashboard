import React, { useEffect } from "react";
import { FaEdit } from "react-icons/fa";
import { FaTrashAlt } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { showAssignForm, showModal } from "../features/modal/modalSlice";
import { setEditUser } from "../features/user/UserSlice";

function OptionsModal({ optionBtnPositions }) {
  useEffect(() => {
    console.log(optionBtnPositions);
  }, [optionBtnPositions]);

  const dispatch = useDispatch();

  // handleOption
  function handleOption(e) {
    e.preventDefault();

    if (e.target.name === "edit") {
      // set the isEdit to true in userSlice
      dispatch(setEditUser(true));

      // show modal -> opens a modal with users form
      dispatch(showModal());
    }
  }

  return (
    <div
      className={`min-h-[70px] w-[100px] px-3 p-2 rounded shadow bg-white absolute flex flex-col justify-around text-zinc-700`}
      style={{
        left: `${optionBtnPositions.x - 110}px`,
        top: `${optionBtnPositions.y - 80}px`,
      }}
    >
      {/* EDIT BUTTON */}
      <button
        className="capitalize flex items-center gap-1.5 text-xs"
        name="edit"
        onClick={handleOption}
      >
        <span className="text-xs">
          <FaEdit />
        </span>
        edit
      </button>

      {/* DELETE BUTTON */}
      <button
        className="capitalize flex items-center gap-1.5 text-xs"
        name="delete"
        onClick={handleOption}
      >
        <span className="text-xs">
          <FaTrashAlt />
        </span>
        delete
      </button>
    </div>
  );
}

export default OptionsModal;
