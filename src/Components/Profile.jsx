import React from "react";
import { FaUser } from "react-icons/fa6";

function Profile() {
  return (
    <section className="ml-[300px] w-[calc(100%-300px)] rounded-l h-[80v]  overflow-hidden">
      {/* profile header */}
      <div>
        <div
          style={{
            background:
              "url('https://images.unsplash.com/photo-1490604001847-b712b0c2f967?q=80&w=2153&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
          className="bg-green-700 h-[250px]"
        ></div>

        {/* basic-info */}
        <div className="flex items-end px-10 relative max-w-[1000px] mx-auto">
          <h2 className="text-3xl font-bold mt-10 mb-10">Lakhan kumar</h2>
        </div>
      </div>

      {/* profile info */}
      <div className="px-10 max-w-[1000px] mx-auto">
        <h2 className="text-md ">Account Information</h2>

        <div className="grid grid-cols-[110px_1fr] gap-4 justify-start py-6 border-b items-center">
          <h3 className="text-lg">User ID</h3>
          <div>
            <p className="text-sm">fmjeowdipsfh2893y</p>
          </div>
        </div>
        <div className="grid grid-cols-[110px_1fr] gap-4 py-6 border-b items-center">
          <h3 className="text-lg">Email</h3>
          <div>
            <p className="text-sm">lakhan0105@gmail.com</p>
          </div>
        </div>
        <div className="grid grid-cols-[110px_1fr] gap-4 py-6 border-b items-center">
          <h3 className="text-lg">Address</h3>
          <div>
            <p className="text-sm">mahadevapura, Bengaluru</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Profile;
