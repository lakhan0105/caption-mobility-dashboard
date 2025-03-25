import moment from "moment";
import React from "react";
import InfoCardRow from "../InfoCardRow";

function UserFullDetails({ userFullDetailsState }) {
  const {
    $id,
    userName,
    userCompany,
    userPhone,
    $createdAt,
    userStatus,
    userNotes,
    userLocation,
  } = userFullDetailsState;

  return (
    <div className="px-6 py-7">
      {/* USER ID */}
      <InfoCardRow heading={"user id"} value={$id} />

      {/* USER NAME */}
      <InfoCardRow heading={"name"} value={userName} />

      {/* COMPANY */}
      <InfoCardRow heading={"company"} value={userCompany} />

      {/* PHONE */}
      <InfoCardRow heading={"phone"} value={userPhone} />

      {/* LOCATION */}
      <InfoCardRow heading={"location"} value={userLocation} />

      {/* DATE OF ACCOUNT CREATION */}
      <InfoCardRow
        heading={"created at"}
        value={moment($createdAt).format("lll")}
      />
    </div>
  );
}

export default UserFullDetails;
