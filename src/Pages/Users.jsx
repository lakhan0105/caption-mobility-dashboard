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
  setActiveFilter,
  getUserByFilter,
} from "../features/user/UserSlice";
import {
  hideOptionsModal,
  setIsBlockFrom,
  showModal,
} from "../features/modal/modalSlice";

function Users() {
  const { usersList, usersListCount, isUserLoading, activeFilter, errMsg } =
    useSelector((state) => state.userReducer);
  const { isBlockForm } = useSelector((state) => state.modalReducer);
  const dispatch = useDispatch();
  const observer = useRef();
  const hasFetchedInitial = useRef(false);

  // Reference to the last user element
  const lastUserElementRef = useCallback(
    (node) => {
      if (isUserLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && usersList?.length < usersListCount) {
            console.log("Fetching more users:", {
              activeFilter,
              offset: usersList?.length,
            });
            if (activeFilter) {
              dispatch(
                getUserByFilter({
                  ...activeFilter,
                  offset: usersList?.length,
                })
              );
            } else {
              dispatch(getUsersList(usersList?.length));
            }
          }
        },
        { rootMargin: "100px" }
      );
      if (node) observer.current.observe(node);
    },
    [isUserLoading, usersList?.length, usersListCount, activeFilter, dispatch]
  );

  useEffect(() => {
    // Fetch all users only on initial mount if no filter and no users
    if (!hasFetchedInitial.current && !usersList?.length && !activeFilter) {
      console.log("Initial fetch: getUsersList");
      dispatch(getUsersList(0));
      hasFetchedInitial.current = true;
    }
    dispatch(hideOptionsModal());
  }, [dispatch, usersList?.length, activeFilter]);

  // Open the modal when clicked on add new user
  function handleNewUser() {
    dispatch(setIsBlockFrom(false));
    dispatch(setEditUser(false));
    dispatch(showModal());
  }

  // Handle users search
  function handleUsersSearch(inputText) {
    console.log("Search triggered:", inputText);
    if (inputText) {
      dispatch(getUserBySearch({ inputText, offset: 0 }));
      dispatch(setActiveFilter(null)); // Clear filter during search
    } else {
      dispatch(getUsersList(0));
    }
  }

  return (
    <section className="w-full max-w-[900px] md:ml-[300px] md:w-[calc(100%-300px)] pb-20">
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
        {isUserLoading && !usersList?.length ? (
          <div className="text-center py-4">Loading...</div>
        ) : errMsg ? (
          <div className="text-center py-4 text-red-500">{errMsg}</div>
        ) : usersList?.length ? (
          <UsersTable
            data={usersList}
            lastUserElementRef={lastUserElementRef}
          />
        ) : (
          <div className="text-center py-4 text-gray-500">No users found</div>
        )}

        {/* Loading indicator for subsequent loads */}
        {isUserLoading && usersList?.length > 0 && (
          <div className="text-center py-4">Loading more users...</div>
        )}

        <Modal>{isBlockForm ? <BlockForm /> : <UserForm />}</Modal>
      </div>
    </section>
  );
}

export default Users;
