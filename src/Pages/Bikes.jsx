import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getBikes } from "../features/bike/bikeSlice";
import {
  BikesTable,
  GenericTable,
  Modal,
  NewBikeForm,
  PageHeader,
  TableHeader,
} from "../Components";
import { showModal } from "../features/modal/modalSlice";

import { MdOutlineElectricBike } from "react-icons/md";

function Bikes() {
  const dispatch = useDispatch();

  const { bikesList, isLoading } = useSelector((state) => state.bikeReducer);
  const { totalBikes } = useSelector((state) => state.countReducer);

  useEffect(() => {
    dispatch(getBikes());
  }, []);

  // if (isLoading) {
  //   return <h2>Loading...</h2>;
  // }

  return (
    <section className="w-full max-w-[900px] md:ml-[300px] md:w-[calc(100%-300px)] px-0 pt-0">
      <div className="max-w-[900px]">
        <PageHeader
          heading={`bikes - ${totalBikes}`}
          btnName={"+ add new bike"}
          handleFunction={() => {
            dispatch(showModal());
          }}
          icon={<MdOutlineElectricBike />}
        />

        {/* bikes table */}
        {bikesList && <BikesTable data={bikesList} />}

        <Modal>
          <NewBikeForm />
        </Modal>
      </div>
    </section>
  );
}

export default Bikes;
