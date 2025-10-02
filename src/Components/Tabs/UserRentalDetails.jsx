import React from "react";
import UserBikeDetails from "./UserBikeDetails";
import UserBatteryDetails from "./UserBatteryDetails";
import { FaTrash } from "react-icons/fa";
import { FaPlus } from "react-icons/fa";
import { showAssignForm, showModal } from "../../features/modal/modalSlice";
import SimpleBtn from "../Buttons/SimpleBtn";
import { useDispatch } from "react-redux";
import { deleteUser } from "../../features/user/UserSlice";
import { useNavigate } from "react-router";

function UserRentalDetails({
  userId,
  userBikeId,
  handleReturnBike,
  userBatteryId,
  chargerStatus,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // handleDelete
  function handleDelete() {
    dispatch(deleteUser(userId))
      .unwrap()
      .then(() => {
        return navigate("/dashboard/users");
      })
      .catch((error) => {
        alert("could not delete the user!");
        console.log(error);
        return;
      });
  }

  // if the userbatteryid and bikeId is not present show a component to assign bike and a button to delete a user
  if (!userBatteryId && !userBikeId) {
    return (
      <section className="text-sm mx-5 mt-5 px-3.5 py-5 rounded border border-zinc-200/70 bg-white/80 mb-8">
        <p className="text-xs mb-3 text-zinc-700/80">
          No bike and battery assigned to the user yet
        </p>

        <div className="flex gap-2">
          {/* ASSIGN BUTTON */}
          <SimpleBtn
            name={"assign"}
            icon={<FaPlus />}
            extraStyles={
              "py-1.5 text-xs capitalize text-zinc-700/80 border-zinc-700/40"
            }
            handleBtn={() => {
              dispatch(showModal());
              dispatch(showAssignForm());
            }}
          />

          {/* DELETE USER BUTTON */}
          <SimpleBtn
            name={"delete"}
            icon={<FaTrash />}
            extraStyles={
              "py-1.5 text-xs capitalize text-red-600 border-red-600/40"
            }
            handleBtn={handleDelete}
          />
        </div>
      </section>
    );
  }

  return (
    <div className="pt-2 mb-24">
      <UserBikeDetails
        userBikeId={userBikeId}
        handleReturnBike={handleReturnBike}
      />

      {/* show this component only if the battery details are present */}
      {userBatteryId && (
        <UserBatteryDetails
          userBatteryId={userBatteryId}
          chargerStatus={chargerStatus}
        />
      )}
    </div>
  );
}

export default UserRentalDetails;
