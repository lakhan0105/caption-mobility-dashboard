import React, { useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { FaTrashAlt } from "react-icons/fa";
import { useSelector } from "react-redux";
import { MdBlockFlipped } from "react-icons/md";

function OptionsModal({ handleEditBtn, handleDeleteBtn, handleBlockBtn }) {
  const { optionsModalPosition } = useSelector((state) => state.modalReducer);

  const { selectedUser } = useSelector((state) => state.userReducer);

  useEffect(() => {
    console.log(optionsModalPosition);
  }, []);

  return (
    <div
      className={`min-h-[70px] w-[100px] px-3 p-2 rounded shadow bg-white absolute flex flex-col justify-around gap-2 text-zinc-700`}
      style={{
        left: `${optionsModalPosition.x - 110}px`,
        top: `${optionsModalPosition.y - 80}px`,
      }}
    >
      {/* EDIT BUTTON */}
      <button
        className="capitalize flex items-center gap-1.5 text-xs"
        name="edit"
        onClick={handleEditBtn}
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
        onClick={handleDeleteBtn}
      >
        <span className="text-xs">
          <FaTrashAlt />
        </span>
        delete
      </button>

      {/* BLOCK/UNBLOCK BUTTON */}
      {/* 
          - this button opens a blockForm from where we can block/unblock the user
          - handleBlockBtn -> opens a block form
      */}
      {handleBlockBtn && (
        <button
          className="capitalize flex items-center gap-1.5 text-xs"
          onClick={handleBlockBtn}
        >
          <span className="text-xs">
            <MdBlockFlipped />
          </span>
          {selectedUser?.isBlocked ? "unblock" : "block"}
        </button>
      )}
    </div>
  );
}

export default OptionsModal;
