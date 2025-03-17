import React from "react";
import { useSelector } from "react-redux";
import GenericTable from "./GenericTable";
import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

function BikesTable({ data }) {
  const { isMobile } = useSelector((state) => state.deviceReducer);

  // data to pass in tableHeader and body
  const bikesTableHeadings = isMobile
    ? ["#", "bike number", "status"]
    : ["#", "bike number", "status", "curr owner", "assigned at"];

  const bikesTableCols = isMobile
    ? "0.1fr 0.6fr 0.5fr"
    : "0.1fr 0.6fr 0.5fr 0.5fr 0.5fr";

  return (
    <GenericTable>
      <TableHeader data={bikesTableHeadings} cols={bikesTableCols} />

      <div>
        {data.map((item, index) => {
          const {
            $id,
            bikeRegNum,
            bikeStatus,
            currOwner,
            assignedAt,
            returnedAt,
          } = item;

          return (
            <TableRow cols={bikesTableCols} key={item.$id}>
              {/* SL NUMBER */}
              <p className="text-[0.7rem] w-[20px] h-[20px] font-medium border bg-indigo-950 text-white flex items-center justify-center rounded-2xl mt-0.5">
                {index + 1}
              </p>

              <p>{bikeRegNum}</p>

              <div className="flex gap-4 justify-center text-xs">
                {bikeStatus ? (
                  <p className="bg-blue-200 px-4 py-1.5 rounded-2xl">Active</p>
                ) : (
                  <p className="bg-red-400/80 px-3 py-1.5 rounded-2xl">
                    Inactive
                  </p>
                )}
              </div>

              {!isMobile && <p>{currOwner ? currOwner : "-"}</p>}
              {!isMobile && <p>{assignedAt ? assignedAt : "-"}</p>}
            </TableRow>
          );
        })}
      </div>
    </GenericTable>
  );
}

export default BikesTable;
