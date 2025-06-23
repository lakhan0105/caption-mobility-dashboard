import React, { useEffect, useRef, useCallback } from "react";
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
  const observer = useRef();
  const [isSearchingOrFiltering, setIsSearchingOrFiltering] =
    React.useState(false);

  // Reference to the last user element
  const lastUserElementRef = useCallback(
    (node) => {
      if (isUserLoading || isSearchingOrFiltering) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && usersList?.length < usersListCount) {
            dispatch(getUsersList(usersList?.length));
          }
        },
        { rootMargin: "100px" } // Trigger 100px before the last row is fully visible
      );
      if (node) observer.current.observe(node);
    },
    [
      isUserLoading,
      isSearchingOrFiltering,
      usersList?.length,
      usersListCount,
      dispatch,
    ]
  );

  useEffect(() => {
    if (!usersList || !usersList?.length) {
      dispatch(getUsersList(0));
    }
    dispatch(hideOptionsModal());
  }, [dispatch, usersList]);

  // Open the modal when clicked on add new user
  function handleNewUser() {
    dispatch(setIsBlockFrom(false));
    dispatch(setEditUser(false));
    dispatch(showModal());
  }

  // Handle users search
  function handleUsersSearch(inputText) {
    if (inputText) {
      setIsSearchingOrFiltering(true);
      dispatch(getUserBySearch(inputText));
    } else {
      setIsSearchingOrFiltering(false);
      dispatch(getUsersList(0)); // Reset to full list when search is cleared
    }
  }

  return (
    <section className="w-full max-w-[900px] md:ml-[300px] md:w-[calc(100%-300px)]">
      <div className="max-w-[900px] overflow-hidden">
        {/* PAGE TOP SECTION */}
        <PageHeader
          heading={`users list - ${usersListCount}`}
          handleFunction={handleNewUser}
        >
          <SearchBar
            handleSearch={handleUsersSearch}
            placeHolder={"find users"}
          />
          <Filters />
        </PageHeader>

        {/* Users table */}
        <UsersTable data={usersList} lastUserElementRef={lastUserElementRef} />

        {/* Optional: Show loading indicator */}
        {isUserLoading && (
          <div className="text-center py-4">Loading more users...</div>
        )}

        <Modal>{isBlockForm ? <BlockForm /> : <UserForm />}</Modal>
      </div>
    </section>
  );
}

export default Users;
