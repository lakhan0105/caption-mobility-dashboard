import React, { useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { FaTrashAlt } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { MdBlockFlipped } from "react-icons/md";
import { TbDownload } from "react-icons/tb";
import { IoIosClose } from "react-icons/io";
import { hideOptionsModal } from "../features/modal/modalSlice";

function OptionsModal({
  optionsModalState,
  handleEditBtn,
  handleDeleteBtn,
  handleBlockBtn,
  openQrCodeComp,
}) {
  const dispatch = useDispatch();

  const { selectedUser } = useSelector((state) => state.userReducer);

  return (
    <div
      className={`min-h-[180px] max-h-[250px] px-4 pt-6 bg-white  text-zinc-700 fixed bottom-[50px] left-0 right-0 animate-slide-up z-[30]`}
      style={{
        borderTopLeftRadius: "10px",
        borderTopRightRadius: "10px",
        boxShadow: "0 10px 20px -3px black",
      }}
    >
      {/* HEADING and CLOSE OPTIONS BUTTON */}
      <div className="w-full relative text-zinc-700/80 mb-7">
        <h2 className="text-sm mb-1">Options</h2>

        {/* CLOSE OPTIONS MODAL BUTTON */}
        <button
          className="text-3xl absolute right-0 top-[-10px]"
          onClick={(e) => {
            e.preventDefault();
            dispatch(hideOptionsModal());
          }}
        >
          <IoIosClose />
        </button>
      </div>

      {/* OPTION BUTTONS CONTAINER */}
      <div className="flex flex-col justify-start gap-3.5">
        {/* EDIT BUTTON */}
        <button
          className="capitalize flex items-center gap-2 text-xs"
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
          className="capitalize flex items-center gap-2 text-xs"
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
            className="capitalize flex items-center gap-2 text-xs"
            onClick={handleBlockBtn}
          >
            <span className="text-xs">
              <MdBlockFlipped />
            </span>
            {selectedUser?.isBlocked ? "unblock" : "block"}
          </button>
        )}

        {/* DOWNLOAD QR CODE BUTTON */}
        {openQrCodeComp && (
          <button
            className="capitalize flex items-center gap-2 text-xs"
            onClick={openQrCodeComp}
          >
            <span className="text-xs">
              <TbDownload />
            </span>
            get QR
          </button>
        )}
      </div>
    </div>
  );
}

export default OptionsModal;
