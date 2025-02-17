import React, { useEffect } from "react";
import { Modal, UserCard, UsersTable } from "../Components";
import { useDispatch, useSelector } from "react-redux";
import { getUsersList } from "../features/user/UserSlice";

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

  // isUserLoading
  // if (isUserLoading) {
  //   return <h2 className="ml-[300px] w-[calc(100%-300px)]">Loading...</h2>;
  // }

  // if users length is 0
  if (usersList?.length === 0) {
    return <h2 className="ml-[300px] w-[calc(100%-300px)]">No users found!</h2>;
  }

  return (
    <section className="pl-[360px] w-[calc(100%-300px)] pl-16 pt-8 flex gap-10">
      {usersList && <UsersTable data={usersList} />}
      {/* <UserCard /> */}

      {/* MODAL */}
      <Modal />
    </section>
  );
}

export default Users;
