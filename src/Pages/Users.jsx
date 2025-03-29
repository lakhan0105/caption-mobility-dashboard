import React, { useEffect } from "react";
import {
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
import { showModal } from "../features/modal/modalSlice";

function Users() {
  const { usersList, isUserLoading } = useSelector(
    (state) => state.userReducer
  );

  const dispatch = useDispatch();

  useEffect(() => {
    if (!usersList || !usersList?.length) {
      dispatch(getUsersList());
    }
  }, []);

  // open the modal when clicked on add new user
  function handleNewUser() {
    // set the isEditUser to false
    dispatch(setEditUser(false));

    // modal has the UserForm that adds a new user
    dispatch(showModal());
  }

  // handleUsersSearch
  function handleUsersSearch(inputText) {
    dispatch(getUserBySearch(inputText));
  }

  return (
    <section className="w-full max-w-[900px] md:ml-[300px] md:w-[calc(100%-300px)]">
      <div className="max-w-[900px] overflow-hidden">
        {/* PAGE TOP SECTION*/}
        <PageHeader heading={"users list"} handleFunction={handleNewUser}>
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

        <Modal>
          <UserForm />
        </Modal>
      </div>
    </section>
  );
}

export default Users;
