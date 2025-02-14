import React from "react";

function ProfileRow({ heading, value }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-4 py-6 border-b items-center">
      <h3 className="text-lg">{heading}</h3>
      <div>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}

export default ProfileRow;
