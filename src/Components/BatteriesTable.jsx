import React, { useEffect } from "react";
import GenericTable from "./GenericTable";
import TableHeader from "./TableHeader";
import { useSelector } from "react-redux";
import TableRow from "./TableRow";

function BatteriesTable({ data }) {
  const { isMobile } = useSelector((state) => state.deviceReducer);

  const batteryTableHeadings = isMobile
    ? ["#", "batteryNum", "status"]
    : ["#", "batteryNum", "status"];

  const batteryCols = isMobile ? "0.1fr 0.6fr 0.5fr" : "0.1fr 1fr 0.5fr ";

  return (
    <GenericTable>
      <TableHeader data={batteryTableHeadings} cols={batteryCols} />

      {/* TABLE DATA */}
      <div>
        {data?.map((item, index) => {
          const {
            $id,
            batRegNum,
            batStatus,
            currOwner,
            assignedAt,
            returnedAt,
          } = item;

          return (
            <TableRow cols={batteryCols} key={$id}>
              {/* SL NUMBER */}
              <p className="text-[0.7rem] w-[20px] h-[20px] font-medium border bg-indigo-950 text-white flex items-center justify-center rounded-2xl mt-0.5">
                {index + 1}
              </p>

              <h2 className="font-medium text-md capitalize">{batRegNum}</h2>

              {/* BATTERY STATUS */}
              <div className="flex gap-4 justify-center text-xs">
                {batStatus ? (
                  <p className="bg-blue-200 px-4 py-1.5 rounded-2xl">Active</p>
                ) : (
                  <p className="bg-red-400/80 px-3 py-1.5 rounded-2xl">
                    Inactive
                  </p>
                )}
              </div>
            </TableRow>
          );
        })}
      </div>
    </GenericTable>
  );
}

export default BatteriesTable;
