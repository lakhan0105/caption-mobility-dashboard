import React, { useEffect } from "react";
import { Modal, UserCard, UserForm, UsersTable } from "../Components";
import { useDispatch, useSelector } from "react-redux";
import { getUsersList } from "../features/user/UserSlice";
import { showModal } from "../features/modal/modalSlice";

function Users() {
  const { usersList } = useSelector((state) => state.userReducer);

  const dispatch = useDispatch();

  useEffect(() => {
    if (!usersList || !usersList?.length) {
      dispatch(getUsersList());
    }
  }, []);

  // if users length is 0
  if (usersList?.length === 0) {
    return <h2 className="ml-[300px] w-[calc(100%-300px)]">No users found!</h2>;
  }

  // open the modal when clicked on add new user
  function handleNewUser() {
    dispatch(showModal());
  }

  return (
    <section className="w-full max-w-[900px] md:ml-[300px] md:w-[calc(100%-300px)] px-5 pt-8">
      <div className="max-w-[900px]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-medium">Users List</h2>
          <button
            className="border px-4 py-2.5 rounded-md bg-blue-500 text-white text-sm cursor-pointer"
            onClick={handleNewUser}
          >
            + Add New User
          </button>
        </div>

        {/* users table */}
        {usersList && <UsersTable data={usersList} />}

        <Modal>
          <UserForm />
        </Modal>
      </div>
    </section>
  );
}

export default Users;
