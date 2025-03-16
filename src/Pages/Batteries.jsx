import React, { useEffect } from "react";
import {
  BatteriesTable,
  Modal,
  NewBatteryForm,
  PageHeader,
} from "../Components";
import { useDispatch, useSelector } from "react-redux";
import { getBatteriesList } from "../features/battery/batterySlice";
import { showModal } from "../features/modal/modalSlice";
import { GiBatteries } from "react-icons/gi";

function Batteries() {
  const { batteriesList } = useSelector((state) => state.batteryReducer);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getBatteriesList());
  }, []);

  return (
    <section className="w-full max-w-[900px] md:ml-[300px] md:w-[calc(100%-300px)] px-0 pt-0">
      <div className="max-w-[900px]">
        {/* PAGE HEADER */}
        <PageHeader
          heading={"Batteries"}
          btnName={"+ add new battery"}
          handleFunction={() => {
            dispatch(showModal());
          }}
          icon={<GiBatteries />}
        />

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
