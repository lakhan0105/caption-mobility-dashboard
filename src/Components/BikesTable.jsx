import React from "react";
import { useDispatch, useSelector } from "react-redux";
import GenericTable from "./GenericTable";
import TableHeader from "./TableHeader";
import TableRow from "./TableRow";
import { SlOptionsVertical } from "react-icons/sl";
import {
  deleteBike,
  setEditBike,
  setSelectedBike,
} from "../features/bike/bikeSlice";
import {
  hideOptionsModal,
  setOptionsModalPosition,
  showModal,
  showOptionsModal,
} from "../features/modal/modalSlice";
import OptionsModal from "./OptionsModal";
import toast from "react-hot-toast";

function BikesTable({ data, lastBikeElementRef }) {
  const { isMobile } = useSelector((state) => state.deviceReducer);
  const { selectedBike, isLoading } = useSelector((state) => state.bikeReducer);
  const { optionsModalState } = useSelector((state) => state.modalReducer);
  const dispatch = useDispatch();

  // Data for table header and body
  const bikesTableHeadings = isMobile
    ? ["#", "bike number", "status"]
    : ["#", "bike number", "status", "curr owner", "assigned at"];

  const bikesTableCols = isMobile
    ? "0.1fr 0.6fr 0.5fr 0.05fr"
    : "0.1fr 0.6fr 0.5fr 0.5fr 0.5fr 0.05fr";

  // Handle options button
  function handleOptionsBtn(e, data) {
    e.preventDefault();
    if (optionsModalState) {
      dispatch(hideOptionsModal());
      dispatch(setEditBike(false));
    } else {
      dispatch(showOptionsModal());
      dispatch(setOptionsModalPosition({ x: e.clientX, y: e.clientY }));
      dispatch(setSelectedBike(data));
    }
  }

  // Handle edit button
  function handleEditBike(e) {
    e.preventDefault();
    dispatch(setEditBike(true));
    dispatch(showModal());
    dispatch(hideOptionsModal());
  }

  // Handle delete button
  function handleDeleteBike(e) {
    e.preventDefault();
    if (selectedBike?.currOwner) {
      toast.error(
        "The bike is active and cannot be deleted! Please make it inactive"
      );
      return;
    }
    dispatch(deleteBike(selectedBike?.$id))
      .unwrap()
      .then(() => {
        dispatch(hideOptionsModal());
      });
  }

  if (isLoading && !data?.length) {
    return <h2 className="text-center">Loading...</h2>;
  }

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
          const isLastBike = index === data.length - 1;

          return (
            <TableRow
              cols={bikesTableCols}
              key={$id}
              ref={isLastBike ? lastBikeElementRef : null}
            >
              {/* SL NUMBER */}
              <p className="text-[0.7rem] w-[20px] h-[20px] font-medium border bg-indigo-950 text-white flex items-center justify-center rounded-2xl mt-0.5">
                {index + 1}
              </p>

              <p>{bikeRegNum?.toUpperCase()}</p>

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

              {/* OPTIONS BUTTON */}
              <button onClick={(e) => handleOptionsBtn(e, item)}>
                <SlOptionsVertical />
              </button>
            </TableRow>
          );
        })}
      </div>

      {optionsModalState && selectedBike?.$id && (
        <OptionsModal
          optionsModalState={optionsModalState}
          handleEditBtn={handleEditBike}
          handleDeleteBtn={handleDeleteBike}
        />
      )}
    </GenericTable>
  );
}

export default BikesTable;
