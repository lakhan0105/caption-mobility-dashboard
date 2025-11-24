import React, { useState, useEffect } from "react";
import { databases } from "../appwrite";
import { Query, ID } from "appwrite";
import toast from "react-hot-toast";

const Payments = () => {
  const dbId = import.meta.env.VITE_DB_ID;
  const usersCollId = import.meta.env.VITE_USERS_COLL_ID;
  const companyCollId = import.meta.env.VITE_COMPANY_COLL_ID;
  const paymentRecordsCollId = import.meta.env.VITE_PAYMENT_RECORDS_COLL_ID;

  const [payments, setPayments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState({
    rent: 0,
    pending: 0,
    total: 0,
  });
  const [collecting, setCollecting] = useState({});

  // Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [utrInput, setUtrInput] = useState("");

  // Plan types and their rent amounts
  const PLAN_RATES = {
    BS: 1800,
    CS: 1740,
  };

  // Helper function to get rent amount based on plan type
  const getRentAmount = (planType) => {
    // If planType is empty or null, default to BS
    if (!planType || planType.trim() === "") {
      return PLAN_RATES.BS;
    }
    return PLAN_RATES[planType] || PLAN_RATES.BS;
  };

  // Get IST date range for today (start and end in UTC)
  const getTodayISTRange = () => {
    const now = new Date();

    // Get IST date string (YYYY-MM-DD)
    const istDateString = now.toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    // Create start of day in IST (00:00:00)
    const startOfDayIST = new Date(istDateString + "T00:00:00+05:30");

    // Create end of day in IST (23:59:59)
    const endOfDayIST = new Date(istDateString + "T23:59:59+05:30");

    // Convert to UTC ISO strings for Appwrite queries
    return {
      start: startOfDayIST.toISOString(),
      end: endOfDayIST.toISOString(),
      dateString: istDateString,
    };
  };

  // Get current timestamp in UTC (Appwrite compatible)
  const getUTCTimestamp = () => {
    return new Date().toISOString();
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      setPayments([]);
      fetchWeeklyRent();
    }
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
        setTotalAmount({ rent: 0, pending: 0, total: 0 });
        setLoading(false);
        return;
      }

      const { start: todayStart, end: todayEnd } = getTodayISTRange();

      console.log("Querying for today IST:", todayStart, "to", todayEnd);

      // Get ALL active users with bikes
      const usersRes = await databases.listDocuments(dbId, usersCollId, [
        Query.equal("userCompany", company.companyName),
        Query.equal("userStatus", true),
        Query.isNotNull("bikeId"),
        Query.limit(500),
      ]);

      if (usersRes.documents.length === 0) {
        setPayments([]);
        setTotalAmount({ rent: 0, pending: 0, total: 0 });
        setLoading(false);
        return;
      }

      const userIds = usersRes.documents.map((u) => u.$id);

      // Get rent status for today using UTC timestamps
      const [collectedRentRes, pendingRentRes] = await Promise.all([
        databases.listDocuments(dbId, paymentRecordsCollId, [
          Query.equal("userId", userIds),
          Query.equal("type", "rent"),
          Query.or([
            Query.equal("method", "cash"),
            Query.equal("method", "online"),
          ]),
          Query.greaterThanEqual("date", todayStart),
          Query.lessThanEqual("date", todayEnd),
          Query.limit(500),
        ]),
        databases.listDocuments(dbId, paymentRecordsCollId, [
          Query.equal("userId", userIds),
          Query.equal("type", "rent"),
          Query.equal("method", "pending"),
          Query.greaterThanEqual("date", todayStart),
          Query.lessThanEqual("date", todayEnd),
          Query.limit(500),
        ]),
      ]);

      console.log("Collected rent today:", collectedRentRes.documents.length);
      console.log("Pending rent today:", pendingRentRes.documents.length);

      const collectedRentSet = new Set(
        collectedRentRes.documents.map((d) => d.userId)
      );
      const pendingRentMap = new Map(
        pendingRentRes.documents.map((d) => [d.userId, d.$id])
      );

      // Create missing pending records
      const usersNeedingPending = usersRes.documents.filter(
        (u) => !collectedRentSet.has(u.$id) && !pendingRentMap.has(u.$id)
      );

      if (usersNeedingPending.length > 0) {
        console.log(
          "Creating pending records for:",
          usersNeedingPending.length,
          "users"
        );

        const createPromises = usersNeedingPending.map(async (user) => {
          try {
            const userRentAmount = getRentAmount(user.planType);
            const doc = await databases.createDocument(
              dbId,
              paymentRecordsCollId,
              ID.unique(),
              {
                userId: user.$id,
                amount: userRentAmount,
                type: "rent",
                method: "pending",
                date: getUTCTimestamp(),
              }
            );
            pendingRentMap.set(user.$id, doc.$id);
          } catch (error) {
            console.error(`Failed to create pending for ${user.$id}:`, error);
          }
        });

        await Promise.allSettled(createPromises);
      }

      // Build final payment list - SHOW ALL ACTIVE USERS
      const finalList = usersRes.documents.map((user) => {
        const pendingAmt = parseInt(user.pendingAmount || 0);
        const rentCollected = collectedRentSet.has(user.$id);
        const planType = user.planType || "BS"; // Default to BS if empty
        const weeklyRent = getRentAmount(planType);

        // Calculate only uncollected amounts
        let totalToCollect = 0;
        if (!rentCollected) totalToCollect += weeklyRent;
        if (pendingAmt > 0) totalToCollect += pendingAmt;

        return {
          paymentId: pendingRentMap.get(user.$id) || null,
          userId: user.$id,
          userName: user.userName || "N/A",
          userPhone: user.userPhone || "N/A",
          planType,
          weeklyRent,
          pendingAmount: pendingAmt,
          totalToCollect,
          rentCollected,
        };
      });

      setPayments(finalList);

      // Calculate separate totals
      const totalRent = finalList.reduce(
        (sum, p) => sum + (p.rentCollected ? 0 : p.weeklyRent),
        0
      );
      const totalPending = finalList.reduce(
        (sum, p) => sum + p.pendingAmount,
        0
      );
      const total = totalRent + totalPending;

      setTotalAmount({ rent: totalRent, pending: totalPending, total });
    } catch (e) {
      console.error(e);
      toast.error("Failed to load rent data");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (payment, type) => {
    const amount = type === "rent" ? payment.weeklyRent : payment.pendingAmount;

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
        // Update rent payment record with UTC timestamp
        const updateData = {
          method: paymentMethod,
          date: getUTCTimestamp(),
        };
        if (paymentMethod === "online") updateData.utrNumber = utrInput.trim();

        await databases.updateDocument(
          dbId,
          paymentRecordsCollId,
          currentPayment.paymentId,
          updateData
        );

        // Update UI
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
        setTotalAmount((prev) => ({
          rent: prev.rent - currentPayment.weeklyRent,
          pending: prev.pending,
          total: prev.total - currentPayment.weeklyRent,
        }));

        toast.success(`✅ Rent ₹${currentPayment.weeklyRent} collected!`);
      } else if (currentPayment.collectType === "pending") {
        // Create pending clearance record with UTC timestamp
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
            date: getUTCTimestamp(),
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

        // Update UI
        setPayments((prev) =>
          prev.map((p) =>
            p.userId === currentPayment.userId
              ? {
                  ...p,
                  pendingAmount: 0,
                  pendingCollected: true,
                  totalToCollect: p.rentCollected ? 0 : p.weeklyRent,
                }
              : p
          )
        );
        setTotalAmount((prev) => ({
          rent: prev.rent,
          pending: prev.pending - currentPayment.pendingAmount,
          total: prev.total - currentPayment.pendingAmount,
        }));

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

  const getPlanBadge = (planType) => {
    if (planType === "CS") {
      return (
        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
          CS
        </span>
      );
    }
    return (
      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
        BS
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 bg-white">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Weekly Rent Collection</h1>
          <p className="text-gray-600">
            BS Plan: ₹1,800/week • CS Plan: ₹1,740/week
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
          <div className="bg-gray-50 p-4 rounded mb-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {
                    companies.find((c) => c.$id === selectedCompany)
                      ?.companyName
                  }
                </h3>
                <p className="text-sm text-gray-600">
                  {payments.length} active user(s) with bikes
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-3xl font-bold text-green-600">
                  ₹{totalAmount.total.toLocaleString("en-IN")}
                </p>
                <p className="text-sm text-gray-600">Total Uncollected</p>
                <div className="mt-2 flex gap-4 text-sm justify-end">
                  <div>
                    <span className="text-gray-500">Rent:</span>
                    <span className="font-semibold text-red-600 ml-1">
                      ₹{totalAmount.rent.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Pending:</span>
                    <span className="font-semibold text-blue-600 ml-1">
                      ₹{totalAmount.pending.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading payments...</p>
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
                        Plan
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
                        <td className="px-6 py-4 text-sm">
                          {getPlanBadge(p.planType)}
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
                              ₹{p.weeklyRent.toLocaleString("en-IN")}
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
                        <div className="mt-1">{getPlanBadge(p.planType)}</div>
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
                            ₹{p.weeklyRent.toLocaleString("en-IN")}
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
            <p className="text-sm text-gray-600 mb-2">
              {currentPayment.userName}
            </p>
            {currentPayment.collectType === "rent" && (
              <p className="text-xs text-gray-500 mb-4">
                Plan: {currentPayment.planType} (₹{currentPayment.weeklyRent}
                /week)
              </p>
            )}
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
