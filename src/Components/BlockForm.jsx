import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeModal, setIsBlockFrom } from "../features/modal/modalSlice";
import { MdBlockFlipped } from "react-icons/md";
import { getUsersList, toggleUserBlock } from "../features/user/UserSlice";
import toast from "react-hot-toast";

function BlockForm() {
  const { selectedUser } = useSelector((state) => state.userReducer);
  const dispatch = useDispatch();

  const [userNotesState, setUserNotesState] = useState("");

  // to close the blockForm
  function handleClose() {
    dispatch(closeModal());
    dispatch(setIsBlockFrom(false));
  }

  // handleBlockUser
  // - blocks/unblocks the user
  function handleBlockUser() {
    dispatch(
      toggleUserBlock({
        userId: selectedUser?.$id,
        isBlocked: selectedUser?.isBlocked ? false : true,
        userNotes: userNotesState,
      })
    )
      .unwrap()
      .then((resp) => {
        if (resp) {
          handleClose();
          dispatch(getUsersList());
        }
      });
  }

  return (
    <div className="w-full max-w-[340px] min-h-[150px] max-h-[250px] bg-white rounded-lg p-4 px-6 flex flex-col justify-cente leading-loose">
      {!selectedUser?.isBlocked && (
        <div>
          <h3 className="font-medium mb-1">
            Why do you want to block this user?
          </h3>
          <textarea
            name="block-reason"
            id="block-reason"
            cols={30}
            rows={5}
            className="border text-xs p-2 border-zinc-700 rounded w-full max-w-[80%"
            placeholder="type here..."
            required={true}
            value={userNotesState}
            onChange={(e) => {
              setUserNotesState(e.target.value);
            }}
          ></textarea>
        </div>
      )}

      {selectedUser?.isBlocked && (
        <div className="mb-1">
          <h3 className="font-medium">You blocked this user because</h3>
          <p className="text-sm">{selectedUser?.userNotes}</p>
        </div>
      )}

      <div className="flex gap-2 mt-auto">
        <button
          className="px-2 py-2  rounded text-sm flex items-center justify-center gap-0.5 bg-blue-500 text-white capitalize w-full"
          onClick={handleBlockUser}
        >
          <span>
            <MdBlockFlipped />
          </span>
          {selectedUser?.isBlocked ? "unblock" : "block"}
        </button>

        <button
          className="px-2 py-2  rounded text-sm flex items-center justify-center gap-0.5 bg-red-500 text-white capitalize w-full"
          onClick={handleClose}
        >
          cancel
        </button>
      </div>
    </div>
  );
}

export default BlockForm;
