import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getBikes } from "../features/bike/bikeSlice";
import { BikesTable, GenericTable, Modal, TableHeader } from "../Components";

function Bikes() {
  const dispatch = useDispatch();

  const { bikesList, isBikesLoading } = useSelector(
    (state) => state.bikeReducer
  );

  useEffect(() => {
    if (!bikesList) {
      dispatch(getBikes());
    }
    console.log(bikesList);
  }, []);

  if (isBikesLoading) {
    return <h2>Loading...</h2>;
  }

  return (
    <section className="w-full max-w-[900px] md:ml-[300px] md:w-[calc(100%-300px)] px-5 pt-8">
      <div className="max-w-[900px]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-medium">Bikes List</h2>
          <button className="border px-4 py-2.5 rounded-md bg-blue-500 text-white text-sm cursor-pointer">
            + Add New Bike
          </button>
        </div>

        {/* bikes table */}
        {bikesList && <BikesTable data={bikesList} />}
        {isBikesLoading && <h2>Loading...</h2>}

        <Modal>{/* <UserForm /> */}</Modal>
      </div>
    </section>
  );
}

export default Bikes;
