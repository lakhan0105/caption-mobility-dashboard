import moment from "moment";
import React from "react";

function UserFullDetails({ userFullDetailsState }) {
  const {
    $id,
    userName,
    userCompany,
    userPhone,
    $createdAt,
    userStatus,
    userNotes,
  } = userFullDetailsState;

  return (
    <div className="text-sm p-2">
      <div className="mb-5 flex justify-between items-start">
        <div>
          <h3 className="capitalize">User Id</h3>
          <p className="text-[0.7rem] text-zinc-500">{$id}</p>
        </div>
      </div>

      <div className="mb-5 flex justify-between items-start">
        <div>
          <h3 className="capitalize">name</h3>
          <p className="text-[0.7rem] text-zinc-500">{userName}</p>
        </div>
      </div>

      <div className="mb-5 flex justify-between items-start">
        <div>
          <h3 className="capitalize">company</h3>
          <p className="text-[0.7rem] text-zinc-500">{userCompany}</p>
        </div>
      </div>

      <div className="mb-5 flex justify-between items-start">
        <div>
          <h3 className="capitalize">phone</h3>
          <p className="text-[0.7rem] text-zinc-500">{userPhone}</p>
        </div>
      </div>

      <div>
        <h3 className="capitalize">Account created at</h3>
        <p className="text-[0.7rem] text-zinc-500">
          {moment($createdAt).format("lll")}
        </p>
      </div>
    </div>
  );
}

export default UserFullDetails;
