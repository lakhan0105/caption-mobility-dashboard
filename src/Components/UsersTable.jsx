import React from "react";
import { TableHeader, TableRow } from "../Components";

function UsersTable({ data }) {
  return (
    <div className="rounded-lg shadow shadow-gray-200/10 w-full max-w-[900px]">
      {/* TABLE HEADER */}
      <TableHeader />

      {/* TABLE DATA */}
      <div>
        {data.map((item) => {
          const { $id, userName, userEmail, userPhone } = item;

          return (
            <TableRow
              key={$id}
              id={$id}
              name={userName}
              email={userEmail}
              phone={userPhone}
              address={"mahadevapura, Bengaluru"}
            />
          );
        })}
      </div>
    </div>
  );
}

export default UsersTable;
