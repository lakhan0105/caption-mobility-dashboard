import React, { useEffect } from "react";
import {
  Modal,
  PageHeader,
  UserCard,
  UserForm,
  UsersTable,
} from "../Components";
import { useDispatch, useSelector } from "react-redux";
import { getUsersList } from "../features/user/UserSlice";
import { showModal } from "../features/modal/modalSlice";

import { FaUsers } from "react-icons/fa";

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
    <section className="w-full max-w-[900px] md:ml-[300px] md:w-[calc(100%-300px)]">
      <div className="max-w-[900px]">
        {/* PAGE TOP SECTION*/}
        <PageHeader
          heading={"users list"}
          btnName={"+ add new user"}
          handleFunction={handleNewUser}
          icon={<FaUsers />}
        />

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
