import React, { useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { FaTrashAlt } from "react-icons/fa";
import { useSelector } from "react-redux";

function OptionsModal({ handleEditBtn, handleDeleteBtn }) {
  const { optionsModalPosition } = useSelector((state) => state.modalReducer);

  useEffect(() => {
    console.log(optionsModalPosition);
  }, []);

  return (
    <div
      className={`min-h-[70px] w-[100px] px-3 p-2 rounded shadow bg-white absolute flex flex-col justify-around text-zinc-700`}
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
    </div>
  );
}

export default OptionsModal;
