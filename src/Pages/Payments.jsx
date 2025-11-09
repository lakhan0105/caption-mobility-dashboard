import React, { useState, useEffect } from "react";
import { databases } from "../appwrite";
import { Query, ID } from "appwrite";
import toast from "react-hot-toast";

const Payments = () => {
  const dbId = import.meta.env.VITE_DB_ID;
  const usersCollId = import.meta.env.VITE_USERS_COLL_ID;
  const companyCollId = import.meta.env.VITE_COMPANY_COLL_ID;
  const bikesCollId = import.meta.env.VITE_BIKES_COLL_ID;
  const paymentRecordsCollId = import.meta.env.VITE_PAYMENT_RECORDS_COLL_ID;

  const [payments, setPayments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [collecting, setCollecting] = useState({});

  // Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [utrInput, setUtrInput] = useState("");

  const WEEKLY_RENT = 1700;

  // Get current IST date (YYYY-MM-DD format)
  const getISTDate = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.toISOString().slice(0, 10);
  };

  // Get full IST timestamp
  const getISTTimestamp = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.toISOString();
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) fetchWeeklyRent();
  }, [selectedCompany]);

  const fetchCompanies = async () => {
    try {
      const res = await databases.listDocuments(dbId, companyCollId);
      setCompanies(res.documents);
    } catch (e) {
      toast.error("Failed to load companies");
    }
  };

  const fetchWeeklyRent = async () => {
    setLoading(true);
    try {
      const company = companies.find((c) => c.$id === selectedCompany);
      if (!company) {
        setPayments([]);
        setTotalAmount(0);
        setLoading(false);
        return;
      }

      // 1. Get all active users with bike
      const usersRes = await databases.listDocuments(dbId, usersCollId, [
        Query.equal("userCompany", company.companyName),
        Query.equal("userStatus", true),
        Query.isNotNull("bikeId"),
      ]);

      if (usersRes.documents.length === 0) {
        setPayments([]);
        setTotalAmount(0);
        setLoading(false);
        return;
      }

      const userIds = usersRes.documents.map((u) => u.$id);
      const todayIST = getISTDate();

      // 2. Check which users have rent collected today
      const collectedRentToday = await databases.listDocuments(
        dbId,
        paymentRecordsCollId,
        [
          Query.equal("userId", userIds),
          Query.equal("type", "rent"),
          Query.or([
            Query.equal("method", "cash"),
            Query.equal("method", "online"),
          ]),
          Query.startsWith("date", todayIST),
        ]
      );

      const usersWithCollectedRent = new Set(
        collectedRentToday.documents.map((d) => d.userId)
      );

      // 3. Get pending rent records for today
      const pendingRentToday = await databases.listDocuments(
        dbId,
        paymentRecordsCollId,
        [
          Query.equal("userId", userIds),
          Query.equal("type", "rent"),
          Query.equal("method", "pending"),
          Query.startsWith("date", todayIST),
        ]
      );

      const usersWithPendingRent = new Set(
        pendingRentToday.documents.map((d) => d.userId)
      );

      // 4. Create missing pending rent records
      const pendingRentMap = new Map();
      pendingRentToday.documents.forEach((doc) => {
        pendingRentMap.set(doc.userId, doc.$id);
      });

      for (const user of usersRes.documents) {
        // Skip if user already has any rent record today
        if (
          usersWithCollectedRent.has(user.$id) ||
          usersWithPendingRent.has(user.$id)
        ) {
          continue;
        }

        try {
          const bike = await databases.getDocument(
            dbId,
            bikesCollId,
            user.bikeId
          );
          if (bike.bikeStatus && bike.currOwner === user.$id) {
            const doc = await databases.createDocument(
              dbId,
              paymentRecordsCollId,
              ID.unique(),
              {
                userId: user.$id,
                amount: WEEKLY_RENT,
                type: "rent",
                method: "pending",
                date: getISTTimestamp(),
              }
            );
            pendingRentMap.set(user.$id, doc.$id);
            usersWithPendingRent.add(user.$id);
          }
        } catch (error) {
          console.error(`Error processing user ${user.$id}:`, error);
        }
      }

      // 5. Build final payment list - SHOW ALL ACTIVE USERS
      const finalList = usersRes.documents.map((user) => {
        const userPendingAmt = parseInt(user.pendingAmount || 0);
        const rentCollected = usersWithCollectedRent.has(user.$id);
        const paymentId = pendingRentMap.get(user.$id) || null;

        // Calculate total to collect (only uncollected amounts)
        let totalToCollect = 0;
        if (!rentCollected) {
          totalToCollect += WEEKLY_RENT;
        }
        if (userPendingAmt > 0) {
          totalToCollect += userPendingAmt;
        }

        return {
          paymentId,
          userId: user.$id,
          userName: user.userName || "N/A",
          userPhone: user.userPhone || "N/A",
          rentAmount: WEEKLY_RENT,
          pendingAmount: userPendingAmt,
          totalToCollect,
          rentCollected,
          pendingCollected: false,
        };
      });

      setPayments(finalList);
      setTotalAmount(finalList.reduce((sum, p) => sum + p.totalToCollect, 0));
    } catch (e) {
      console.error(e);
      toast.error("Failed to load rent");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (payment, type) => {
    const amount =
      type === "rent" ? payment.rentAmount : payment.pendingAmount;

    // Check if already collected
    if (type === "rent" && payment.rentCollected) {
      toast.error("Rent already collected today");
      return;
    }
    if (type === "pending" && payment.pendingAmount === 0) {
      toast.error("No pending amount to collect");
      return;
    }

    if (amount <= 0) {
      toast.error(`No ${type} to collect`);
      return;
    }

    setCurrentPayment({ ...payment, collectType: type, amount });
    setShowPaymentModal(true);
  };

  const confirmCollect = async () => {
    if (paymentMethod === "online" && !utrInput.trim()) {
      toast.error("UTR required");
      return;
    }

    setCollecting((prev) => ({
      ...prev,
      [`${currentPayment.userId}-${currentPayment.collectType}`]: true,
    }));

    try {
      if (currentPayment.collectType === "rent") {
        // Update rent payment record from pending to collected
        const updateData = { method: paymentMethod };
        if (paymentMethod === "online") updateData.utrNumber = utrInput.trim();

        await databases.updateDocument(
          dbId,
          paymentRecordsCollId,
          currentPayment.paymentId,
          updateData
        );

        // Update UI - mark rent as collected
        setPayments((prev) =>
          prev.map((p) =>
            p.userId === currentPayment.userId
              ? {
                  ...p,
                  rentCollected: true,
                  totalToCollect: p.pendingAmount,
                }
              : p
          )
        );
        setTotalAmount((prev) => prev - WEEKLY_RENT);

        toast.success(`✅ Rent ₹${WEEKLY_RENT} collected!`);
      } else if (currentPayment.collectType === "pending") {
        // Create pending clearance record with IST timestamp
        await databases.createDocument(
          dbId,
          paymentRecordsCollId,
          ID.unique(),
          {
            userId: currentPayment.userId,
            amount: currentPayment.pendingAmount,
            type: "pending_clearance",
            method: paymentMethod,
            utrNumber: paymentMethod === "online" ? utrInput.trim() : null,
            date: getISTTimestamp(),
          }
        );

        // Clear pending amount in user record
        await databases.updateDocument(
          dbId,
          usersCollId,
          currentPayment.userId,
          {
            pendingAmount: 0,
          }
        );

        // Update UI - mark pending as cleared
        setPayments((prev) =>
          prev.map((p) =>
            p.userId === currentPayment.userId
              ? {
                  ...p,
                  pendingAmount: 0,
                  pendingCollected: true,
                  totalToCollect: p.rentCollected ? 0 : p.rentAmount,
                }
              : p
          )
        );
        setTotalAmount((prev) => prev - currentPayment.pendingAmount);

        toast.success(`✅ Pending ₹${currentPayment.pendingAmount} cleared!`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to collect payment");
    } finally {
      setCollecting((prev) => ({
        ...prev,
        [`${currentPayment.userId}-${currentPayment.collectType}`]: false,
      }));
      setShowPaymentModal(false);
      setUtrInput("");
      setPaymentMethod("cash");
    }
  };

  const refreshData = () => selectedCompany && fetchWeeklyRent();

  const getDayName = (dayNum) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[dayNum] || "N/A";
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 bg-white">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Weekly Rent Collection (₹1,700)
          </h1>
          <p className="text-gray-600">
            All active users shown. Buttons disabled after collection.
          </p>
        </div>
        <button
          onClick={refreshData}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 w-full sm:w-auto"
        >
          Refresh
        </button>
      </div>

      <div className="mb-6">
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="w-full max-w-md px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Company</option>
          {companies.map((c) => (
            <option key={c.$id} value={c.$id}>
              {c.companyName}{" "}
              {c.salaryDay !== undefined &&
                `(Salary: ${getDayName(c.salaryDay)})`}
            </option>
          ))}
        </select>
      </div>

      {selectedCompany && (
        <>
          <div className="bg-gray-50 p-4 rounded mb-6 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg">
                {companies.find((c) => c.$id === selectedCompany)?.companyName}
              </h3>
              <p className="text-sm text-gray-600">
                {payments.length} active user(s) with bikes
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-3xl font-bold text-green-600">
                ₹{totalAmount.toLocaleString("en-IN")}
              </p>
              <p className="text-sm text-gray-600">Total Uncollected</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded">
              <p className="text-gray-600">No active users with bikes</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto bg-white shadow rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Pending
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Weekly Rent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Total Due
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((p) => (
                      <tr key={p.userId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {p.userName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {p.userPhone}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {p.pendingAmount === 0 ? (
                            <span className="text-gray-400">₹0</span>
                          ) : (
                            <span className="font-medium">
                              ₹{p.pendingAmount.toLocaleString("en-IN")}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {p.rentCollected ? (
                            <span className="text-green-600 text-xs font-medium">
                              ✓ Collected
                            </span>
                          ) : (
                            <span className="text-red-600 font-medium">
                              ₹1,700
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                          ₹{p.totalToCollect.toLocaleString("en-IN")}
                        </td>
                        <td className="px-6 py-4 text-sm flex gap-2">
                          <button
                            onClick={() => openModal(p, "pending")}
                            disabled={
                              p.pendingAmount === 0 ||
                              collecting[`${p.userId}-pending`]
                            }
                            className={`px-3 py-1 rounded text-sm ${
                              p.pendingAmount === 0 ||
                              collecting[`${p.userId}-pending`]
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                          >
                            {collecting[`${p.userId}-pending`]
                              ? "..."
                              : p.pendingAmount === 0
                              ? "No Pending"
                              : "Collect Pending"}
                          </button>
                          <button
                            onClick={() => openModal(p, "rent")}
                            disabled={
                              p.rentCollected || collecting[`${p.userId}-rent`]
                            }
                            className={`px-3 py-1 rounded text-sm ${
                              p.rentCollected || collecting[`${p.userId}-rent`]
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-green-600 text-white hover:bg-green-700"
                            }`}
                          >
                            {collecting[`${p.userId}-rent`]
                              ? "..."
                              : p.rentCollected
                              ? "✓ Collected"
                              : "Collect Rent"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4">
                {payments.map((p) => (
                  <div
                    key={p.userId}
                    className="bg-white shadow rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {p.userName}
                        </p>
                        <p className="text-sm text-gray-600">{p.userPhone}</p>
                      </div>
                      <p className="text-xl font-bold text-gray-900">
                        ₹{p.totalToCollect.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="text-sm mb-3 space-y-1">
                      <div className="flex justify-between">
                        <span>Pending:</span>
                        {p.pendingAmount === 0 ? (
                          <span className="text-gray-400">₹0</span>
                        ) : (
                          <span className="font-medium">
                            ₹{p.pendingAmount.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span>Weekly Rent:</span>
                        {p.rentCollected ? (
                          <span className="text-green-600 text-xs font-medium">
                            ✓ Collected
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium">
                            ₹1,700
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(p, "pending")}
                        disabled={
                          p.pendingAmount === 0 ||
                          collecting[`${p.userId}-pending`]
                        }
                        className={`flex-1 py-2 rounded text-sm ${
                          p.pendingAmount === 0 ||
                          collecting[`${p.userId}-pending`]
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {collecting[`${p.userId}-pending`]
                          ? "..."
                          : p.pendingAmount === 0
                          ? "No Pending"
                          : "Collect Pending"}
                      </button>
                      <button
                        onClick={() => openModal(p, "rent")}
                        disabled={
                          p.rentCollected || collecting[`${p.userId}-rent`]
                        }
                        className={`flex-1 py-2 rounded text-sm ${
                          p.rentCollected || collecting[`${p.userId}-rent`]
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {collecting[`${p.userId}-rent`]
                          ? "..."
                          : p.rentCollected
                          ? "✓ Collected"
                          : "Collect Rent"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Payment Modal */}
      {showPaymentModal && currentPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">
              Collect{" "}
              {currentPayment.collectType === "rent"
                ? "Weekly Rent"
                : "Pending Amount"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {currentPayment.userName}
            </p>
            <p className="text-3xl font-bold text-green-600 mb-4">
              ₹{currentPayment.amount.toLocaleString("en-IN")}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="online">Online</option>
              </select>
            </div>

            {paymentMethod === "online" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UTR Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  placeholder="Enter UTR number"
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={confirmCollect}
                disabled={
                  collecting[
                    `${currentPayment.userId}-${currentPayment.collectType}`
                  ]
                }
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {collecting[
                  `${currentPayment.userId}-${currentPayment.collectType}`
                ]
                  ? "Processing..."
                  : "Confirm Collection"}
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setUtrInput("");
                  setPaymentMethod("cash");
                }}
                className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;