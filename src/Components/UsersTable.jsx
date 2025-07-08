import React from "react";
import {
  GenericTable,
  OptionsModal,
  TableHeader,
  TableRow,
} from "../Components";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router";
import { SlOptionsVertical } from "react-icons/sl";

import {
  hideOptionsModal,
  setIsBlockFrom,
  setOptionsModalPosition,
  showModal,
  showOptionsModal,
} from "../features/modal/modalSlice";

import {
  setSelectedUser,
  setEditUser,
  deleteUser,
  getUsersList,
} from "../features/user/UserSlice";

function UsersTable({ data, lastUserElementRef }) {
  const { isMobile } = useSelector((state) => state.deviceReducer);
  const { selectedUser } = useSelector((state) => state.userReducer);
  const { optionsModalState } = useSelector((state) => state.modalReducer);
  const dispatch = useDispatch();

  const userTableHeadings = isMobile
    ? ["#", "user", "status", "company", ""]
    : ["#", "user", "status", "phone", "company"];

  const userCols = isMobile
    ? "0.1fr 0.6fr 0.5fr 0.22fr 0.05fr"
    : "0.1fr 1fr 0.5fr 1fr 0.5fr 0.05fr";

  // showOptionsModal
  function handleOptionsBtn(e, data) {
    e.preventDefault();
    e.stopPropagation(); // Prevent Link navigation when clicking options

    if (optionsModalState) {
      dispatch(hideOptionsModal());
    } else {
      dispatch(showOptionsModal());
      dispatch(setOptionsModalPosition({ x: e.clientX, y: e.clientY }));
      dispatch(setSelectedUser(data));
    }
  }

  // Runs when the edit btn is clicked on a user list
  function showEditForm(e) {
    e.preventDefault();
    e.stopPropagation(); // Prevent Link navigation

    dispatch(setEditUser(true));
    dispatch(showModal());
  }

  // Function to handle deletion of a user from users list
  function handleUserDelete(e) {
    e.preventDefault();
    e.stopPropagation(); // Prevent Link navigation

    dispatch(deleteUser(selectedUser?.$id))
      .unwrap()
      .then(() => {
        dispatch(getUsersList(0)); // Reset list after deletion
        dispatch(hideOptionsModal());
      });
  }

  // Open block modal
  function openBlockModal(e) {
    e.preventDefault();
    e.stopPropagation(); // Prevent Link navigation

    dispatch(setIsBlockFrom(true));
    dispatch(showModal());
    dispatch(hideOptionsModal());
  }

  return (
    <GenericTable>
      {/* TABLE HEADER */}
      <TableHeader data={userTableHeadings} cols={userCols} />

      {/* TABLE DATA */}
      <div>
        {data?.map((item, index) => {
          const {
            $id,
            userName,
            userCompany,
            userPhone,
            userStatus,
            totalSwapCount,
            pendingAmount,
          } = item;
          const isLastUser = index === data.length - 1;

          return (
            <Link key={$id} to={`/dashboard/users/${$id}`}>
              <TableRow
                cols={userCols}
                ref={isLastUser ? lastUserElementRef : null}
              >
                {/* SL NUMBER */}
                <p className="text-[0.7rem] w-[20px] h-[20px] font-medium border bg-indigo-950 text-white flex items-center justify-center rounded-2xl mt-0.5">
                  {index + 1}
                </p>

                {/* USER NAME/BASIC DETAILS */}
                {isMobile ? (
                  <div className="md:hidden flex gap-2">
                    <div>
                      <h2 className="font-medium text-md capitalize">
                        {userName}
                      </h2>
                      <div className="leading-4 mt-0.5">
                        {totalSwapCount > 0 ? (
                          <p className="text-[10px]">
                            {totalSwapCount}{" "}
                            {totalSwapCount <= 1 ? "swap" : "swaps"} with
                            current bike
                          </p>
                        ) : (
                          <p className="text-[10px]"></p>
                        )}
                        {pendingAmount > 0 && (
                          <p className="text-[10px] font-medium text-red-700">
                            pending: ₹{pendingAmount}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex font-semibold items-center gap-4">
                    {userName}
                  </div>
                )}

                <div className="flex gap-4 justify-center text-xs">
                  {userStatus ? (
                    <p className="bg-blue-200 px-4 py-1.5 rounded-2xl">
                      Active
                    </p>
                  ) : (
                    <p className="bg-red-400/80 px-3 py-1.5 rounded-2xl">
                      Inactive
                    </p>
                  )}
                </div>

                <p className="flex justify-cente capitalize text-xs">
                  {userCompany}
                </p>
                {!isMobile && <p>{userPhone}</p>}

                <button onClick={(e) => handleOptionsBtn(e, item)}>
                  <SlOptionsVertical />
                </button>

                {optionsModalState && selectedUser?.$id === $id && (
                  <OptionsModal
                    handleEditBtn={showEditForm}
                    handleDeleteBtn={handleUserDelete}
                    handleBlockBtn={openBlockModal}
                  />
                )}
              </TableRow>
            </Link>
          );
        })}
      </div>
    </GenericTable>
  );
}

export default UsersTable;
