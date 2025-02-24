import React from "react";
import { TableHeader, TableRow } from "../Components";

function UsersTable({ data }) {
  return (
    <div className="rounded-lg shadow shadow-gray-200/10 w-full border">
      {/* TABLE HEADER */}
      <TableHeader />

      {/* TABLE DATA */}
      <div>
        {data.map((item) => {
          const { $id, userName, userCompany, userPhone, userStatus } = item;

          return (
            <TableRow
              key={$id}
              id={$id}
              name={userName}
              company={userCompany}
              phone={userPhone}
              status={userStatus}
            />
          );
        })}
      </div>
    </div>
  );
}

export default UsersTable;
