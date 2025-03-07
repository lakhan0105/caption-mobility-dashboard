import React, { useEffect } from "react";
import { BatteriesTable, Modal, NewBatteryForm } from "../Components";
import { useDispatch, useSelector } from "react-redux";
import { getBatteriesList } from "../features/battery/batterySlice";
import { showModal } from "../features/modal/modalSlice";

function Batteries() {
  const { batteriesList } = useSelector((state) => state.batteryReducer);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getBatteriesList());
  }, []);

  return (
    <section className="w-full max-w-[900px] md:ml-[300px] md:w-[calc(100%-300px)] px-5 pt-8">
      <div className="max-w-[900px]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-medium">Batteries List</h2>
          <button
            className="border px-4 py-2.5 rounded-md bg-blue-500 text-white text-sm cursor-pointer"
            onClick={() => {
              dispatch(showModal());
            }}
          >
            + Add New Battery
          </button>
        </div>

        {/* batteries table */}
        {/* {usersList && <UsersTable data={usersList} />} */}
        <BatteriesTable data={batteriesList} />

        <Modal>
          <NewBatteryForm />
        </Modal>
      </div>
    </section>
  );
}

export default Batteries;
