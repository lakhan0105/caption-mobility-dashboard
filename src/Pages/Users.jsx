import React, { useEffect } from "react";
import {
  BlockForm,
  Filters,
  Modal,
  PageHeader,
  SearchBar,
  UserForm,
  UsersTable,
} from "../Components";
import { useDispatch, useSelector } from "react-redux";

import {
  getUserBySearch,
  getUsersList,
  setEditUser,
} from "../features/user/UserSlice";

import {
  hideOptionsModal,
  setIsBlockFrom,
  showModal,
} from "../features/modal/modalSlice";

function Users() {
  const { usersList, usersListCount, isUserLoading } = useSelector(
    (state) => state.userReducer
  );
  const { isBlockForm } = useSelector((state) => state.modalReducer);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!usersList || !usersList?.length) {
      dispatch(getUsersList(0));
    }
    dispatch(hideOptionsModal());
  }, []);

  // open the modal when clicked on add new user
  function handleNewUser() {
    // hide the block Form if it is rendering in the place of userForm
    dispatch(setIsBlockFrom(false));

    // set the isEditUser to false
    dispatch(setEditUser(false));

    // modal has the UserForm that adds a new user
    dispatch(showModal());
  }

  // handleUsersSearch
  function handleUsersSearch(inputText) {
    dispatch(getUserBySearch(inputText));
  }

  // handleLoadMore
  function handleLoadMore() {
    dispatch(getUsersList(usersList?.length));
  }

  return (
    <section className="w-full max-w-[900px] md:ml-[300px] md:w-[calc(100%-300px)]">
      <div className="max-w-[900px] overflow-hidden">
        {/* PAGE TOP SECTION*/}
        <PageHeader
          heading={`users list - ${usersListCount}`}
          handleFunction={handleNewUser}
        >
          <SearchBar
            handleSearch={handleUsersSearch}
            placeHolder={"find users"}
          />

          {/* add filter buttons here */}
          <Filters />
        </PageHeader>

        {/* users table */}
        {isUserLoading ? (
          <h2 className="text-center">Loading...</h2>
        ) : (
          <UsersTable data={usersList} />
        )}

        {/* load more button */}
        <div className="text-center">
          {usersList?.length !== usersListCount && !isUserLoading && (
            <button
              onClick={handleLoadMore}
              className="mb-28 border px-5 rounded py-1 bg-white text-sm"
            >
              load more
            </button>
          )}
        </div>

        <Modal>{isBlockForm ? <BlockForm /> : <UserForm />}</Modal>
      </div>
    </section>
  );
}

export default Users;
