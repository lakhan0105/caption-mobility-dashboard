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
  const [amountToCollect, setAmountToCollect] = useState(0);

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

  // Calculate the start of the current payment cycle based on company salary day
  const getPaymentCycleStart = (salaryDayOfWeek) => {
    // salaryDayOfWeek: 0 (Sun) - 6 (Sat)
    if (salaryDayOfWeek === undefined || salaryDayOfWeek === null) {
      // Fallback to today if no salary day set
      const { start } = getTodayISTRange();
      return start;
    }

    const now = new Date();


    // Get current IST time
    const istNow = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

    const currentDay = istNow.getDay(); // 0-6
    let diff = currentDay - salaryDayOfWeek;

    // If today is Monday (1) and Salary Day is Tuesday (2) -> diff is -1.
    // We want the PREVIOUS Tuesday, so we subtract 6 more days? 
    // Wait, if today is Mon, last Tue was 6 days ago.
    // Logic: if diff < 0, it means we entered a new week relative to Sunday start, 
    // but haven't passed the Salary Day yet?
    // Actually simpler: 
    // We want the most recent date matching `salaryDayOfWeek`.
    // If today == salaryDay, diff=0 -> Today.
    // If today > salaryDay, diff>0 -> Recent past.
    // If today < salaryDay, diff<0 -> Previous week.

    if (diff < 0) {
      diff += 7;
    }

    const startDate = new Date(istNow);
    startDate.setDate(istNow.getDate() - diff);
    startDate.setHours(0, 0, 0, 0);

    // Convert back to UTC for Appwrite query
    // We need to be careful with timezone conversion. 
    // easiest is to construct the string "YYYY-MM-DD" and append time info
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');

    // Construct IST string
    const cycleStartISO = `${year}-${month}-${day}T00:00:00+05:30`;
    return new Date(cycleStartISO).toISOString();
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

      // Determine the start of the cycle (Most recent Salary Day)
      const cycleStart = getPaymentCycleStart(company.salaryDay);
      // For end date, we can just use "now" or extremely far future, 
      // but practically we just want anything >= cycleStart.
      // We'll use a far future date to be safe or just omit the upper bound if Appwrite allows, 
      // but the previous code had an upper bound. Let's strictly bind to "End of Week" or just "Now + 7 days"?
      // Actually strictly speaking, we just want "After cycle start".
      // But query requires range usually or just GreaterThan.

      console.log("Querying for cycle starting:", cycleStart);

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

      // Rent Cycle Check Logic
      const updatesPromises = usersRes.documents.map(async (user) => {
        try {
          // If no lastRentCheckDate, we assume it's a new user or first time running this feat
          // We set it to cycleStart so we don't double count retrospectively, 
          // OR we could just skip. Let's start tracking from NOW/CycleStart for everyone if missing.
          let lastCheckDate = user.lastRentCheckDate;

          if (!lastCheckDate) {
            // Initialize for existing users to avoid massive back-charges
            // We can silently update it to current cycleStart if missing
            // So next week it will work.
            // However, user wants "if rent not collected on CURRENT cycle... add to pending"
            // This implies we need to check the *previous* cycle? 
            // Actually, if we are in a NEW cycle, and the user hasn't paid for the OLD cycle,
            // that old rent should be in pending.

            // Logic:
            // 1. We are in Cycle B (started This Tuesday).
            // 2. User has lastRentCheckDate in Cycle A (Last Tuesday).
            // 3. If User has NOT paid for Cycle A...
            // 4. Add Cycle A rent to pending.
            // 5. Update lastRentCheckDate to Cycle B start.

            // If lastRentCheckDate is missing, we can't reliably know the history.
            // Safest is to set it to current cycleStart, effectively "starting fresh" for automation.
            return null;
          }

          const lastCheckInfo = new Date(lastCheckDate);
          const currentCycleStartObj = new Date(cycleStart);

          // If last check was BEFORE the current cycle start, we need to verify that period.
          if (lastCheckInfo < currentCycleStartObj) {
            console.log(`Checking past cycle for ${user.userName} (${user.$id})`);

            // Check for ANY rent payment between lastCheckDate and cycleStart
            // limiting to range [lastCheckDate, cycleStart]
            const paymentsInPastCycle = await databases.listDocuments(dbId, paymentRecordsCollId, [
              Query.equal("userId", user.$id),
              Query.equal("type", "rent"),
              Query.greaterThanEqual("date", lastCheckDate),
              Query.lessThan("date", cycleStart),
              Query.limit(1)
            ]);

            const hasPaid = paymentsInPastCycle.documents.length > 0;
            const updates = { lastRentCheckDate: cycleStart }; // Always bump the check date

            if (!hasPaid) {
              // Missed payment! Add to pending.
              const oldPlanType = user.planType || "BS"; // Assumption: plan didn't change
              const missedRent = getRentAmount(oldPlanType);
              const currentPending = user.pendingAmount || 0;
              const newPending = currentPending + missedRent;

              updates.pendingAmount = newPending;

              // Also create a "Missed Rent" record for auditing? 
              // Or just updating pending is enough as per request.
              // We'll just update pending.

              console.log(`User ${user.userName} missed rent. Adding ${missedRent} to pending.`);
              toast(`⏳ Added missed rent to pending for ${user.userName}`, { icon: 'ℹ️' });
            }

            // Apply updates
            await databases.updateDocument(dbId, usersCollId, user.$id, updates);

            // Return updated user object to keep UI in sync
            return { ...user, ...updates };
          }

        } catch (err) {
          console.error(`Error processing cycle for ${user.$id}`, err);
        }
        return null;
      });

      // Wait for all cycle checks to complete
      const processedUsersResults = await Promise.all(updatesPromises);

      // Update our local user list with any changes
      const updatedUsersList = usersRes.documents.map((u, index) => {
        const processed = processedUsersResults[index];
        return processed ? { ...u, ...processed } : u;
      });


      const userIds = updatedUsersList.map((u) => u.$id);

      // Get rent status for current cycle using UTC timestamps
      // We removed the upper bound check (lessThanEqual) because we want ANY payment since the salary day.
      const [collectedRentRes, pendingRentRes] = await Promise.all([
        databases.listDocuments(dbId, paymentRecordsCollId, [
          Query.equal("userId", userIds),
          Query.equal("type", "rent"),
          Query.or([
            Query.equal("method", "cash"),
            Query.equal("method", "online"),
          ]),
          Query.greaterThanEqual("date", cycleStart),
          Query.limit(500),
        ]),
        databases.listDocuments(dbId, paymentRecordsCollId, [
          Query.equal("userId", userIds),
          Query.equal("type", "rent"),
          Query.equal("method", "pending"),
          Query.greaterThanEqual("date", cycleStart),
          Query.limit(500),
        ]),
      ]);

      console.log("Collected rent this cycle:", collectedRentRes.documents.length);
      console.log("Pending rent this cycle:", pendingRentRes.documents.length);

      const collectedRentSet = new Set(
        collectedRentRes.documents.map((d) => d.userId)
      );
      const pendingRentMap = new Map(
        pendingRentRes.documents.map((d) => [d.userId, d.$id])
      );

      // Create missing pending records
      // If we are IN the cycle (e.g. it's salary day OR after), and no payment exists, create pending?
      // Yes, if it's the cycle, we expect payment.
      const usersNeedingPending = updatedUsersList.filter(
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

      // If we found any user without lastRentCheckDate, initialize it now
      const initCheckDatePromises = updatedUsersList
        .filter(u => !u.lastRentCheckDate)
        .map(u => databases.updateDocument(dbId, usersCollId, u.$id, { lastRentCheckDate: cycleStart }));

      if (initCheckDatePromises.length > 0) {
        // Fire and forget initialization
        Promise.allSettled(initCheckDatePromises);
      }

      // Build final payment list - SHOW ALL ACTIVE USERS
      const finalList = updatedUsersList.map((user) => {
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
          lastCallStatus: user.lastCallStatus, // Added
          lastCallDate: user.lastCallDate, // Added
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
    setAmountToCollect(amount);
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
      const collectedAmount = Number(amountToCollect);

      if (currentPayment.collectType === "rent") {
        const shortfall = currentPayment.weeklyRent - collectedAmount;

        // Update rent payment record with collected amount
        const updateData = {
          amount: collectedAmount,
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

        // If shortfall exists, update user pending amount
        let newPendingAmount = currentPayment.pendingAmount;
        const cycleStart = getPaymentCycleStart(companies.find(c => c.$id === selectedCompany)?.salaryDay);

        // We ALWAYS update lastRentCheckDate when rent is collected to mark cycle as "Accounted For"
        const updateBody = {
          lastRentCheckDate: cycleStart
        };

        if (shortfall > 0) {
          newPendingAmount += shortfall;
          updateBody.pendingAmount = newPendingAmount;
        }

        await databases.updateDocument(
          dbId,
          usersCollId,
          currentPayment.userId,
          updateBody
        );

        // Update UI
        setPayments((prev) =>
          prev.map((p) =>
            p.userId === currentPayment.userId
              ? {
                ...p,
                rentCollected: true,
                pendingAmount: newPendingAmount,
                totalToCollect: newPendingAmount,
              }
              : p
          )
        );
        setTotalAmount((prev) => ({
          rent: prev.rent - currentPayment.weeklyRent, // Remove from rent due (since it's now "collected" or moved to pending)
          pending: prev.pending + shortfall, // Add shortfall to global pending
          total: prev.total - collectedAmount, // Total reduces by what we actually got
        }));

        toast.success(`✅ Rent ₹${collectedAmount} collected!${shortfall > 0 ? ` ₹${shortfall} added to pending.` : ''}`);
      } else if (currentPayment.collectType === "pending") {
        if (collectedAmount > currentPayment.pendingAmount) {
          toast.error("Cannot collect more than pending amount");
          return;
        }

        // Create pending clearance record with UTC timestamp
        await databases.createDocument(
          dbId,
          paymentRecordsCollId,
          ID.unique(),
          {
            userId: currentPayment.userId,
            amount: collectedAmount,
            type: "pending_clearance",
            method: paymentMethod,
            utrNumber: paymentMethod === "online" ? utrInput.trim() : null,
            date: getUTCTimestamp(),
          }
        );

        // Update user record with new pending amount
        const newPendingAmount = currentPayment.pendingAmount - collectedAmount;

        await databases.updateDocument(
          dbId,
          usersCollId,
          currentPayment.userId,
          {
            pendingAmount: newPendingAmount,
          }
        );

        // Update UI
        setPayments((prev) =>
          prev.map((p) =>
            p.userId === currentPayment.userId
              ? {
                ...p,
                pendingAmount: newPendingAmount,
                pendingCollected: newPendingAmount === 0, // Only fully collected if 0
                totalToCollect: (p.rentCollected ? 0 : p.weeklyRent) + newPendingAmount,
              }
              : p
          )
        );
        setTotalAmount((prev) => ({
          rent: prev.rent,
          pending: prev.pending - collectedAmount,
          total: prev.total - collectedAmount,
        }));

        toast.success(`✅ Pending ₹${collectedAmount} collected!`);
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

  const updateCallStatus = async (userId, status) => {
    // Optimistic Update
    setPayments((prev) =>
      prev.map((p) =>
        p.userId === userId ? { ...p, lastCallStatus: status } : p
      )
    );

    try {
      await databases.updateDocument(dbId, usersCollId, userId, {
        lastCallStatus: status,
        lastCallDate: getUTCTimestamp(),
      });
      toast.success(status === "picked" ? "Marked as Picked" : "Marked as Not Picked");
    } catch (error) {
      console.error("Failed to update call status:", error);
      toast.error("Failed to update status");
      // Revert on failure
      refreshData();
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
    <div className="max-w-6xl mx-auto p-4 sm:p-6 bg-white pb-24">
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
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Call Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments
                      .map((p) => (
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
                          <td className="px-6 py-4 text-sm">
                            <div className="flex justify-center gap-2 items-center">
                              <a
                                href={`tel:${p.userPhone}`}
                                className="p-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                                title="Call User"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                              </a>
                              <button
                                onClick={() => updateCallStatus(p.userId, "picked")}
                                className={`p-1.5 rounded-full duration-200 transition-colors ${p.lastCallStatus === "picked"
                                  ? "bg-green-600 text-white shadow-sm ring-2 ring-green-200"
                                  : "bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600"
                                  }`}
                                title="Picked"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <button
                                onClick={() => updateCallStatus(p.userId, "not_picked")}
                                className={`p-1.5 rounded-full duration-200 transition-colors ${p.lastCallStatus === "not_picked"
                                  ? "bg-red-600 text-white shadow-sm ring-2 ring-red-200"
                                  : "bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600"
                                  }`}
                                title="Not Picked"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm flex gap-2">
                            <button
                              onClick={() => openModal(p, "pending")}
                              disabled={
                                p.pendingAmount === 0 ||
                                collecting[`${p.userId}-pending`]
                              }
                              className={`px-3 py-1 rounded text-sm ${p.pendingAmount === 0 ||
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
                              className={`px-3 py-1 rounded text-sm ${p.rentCollected || collecting[`${p.userId}-rent`]
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
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">
                          ₹{p.totalToCollect.toLocaleString("en-IN")}
                        </p>
                        {p.lastCallStatus && (
                          <div className="mt-1 flex justify-end">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${p.lastCallStatus === "picked"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                                }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${p.lastCallStatus === "picked" ? "bg-green-600" : "bg-red-600"
                                }`}></span>
                              {p.lastCallStatus === "picked" ? "Picked" : "Not Picked"}
                            </span>
                          </div>
                        )}
                        {p.lastCallDate && (
                          <div className="text-[10px] text-gray-400 text-right mt-0.5">
                            {new Date(p.lastCallDate).toLocaleString('en-IN', {
                              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                            })}
                          </div>
                        )}
                      </div>
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

                    {/* Call Status Actions (Mobile) */}
                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded mb-3">
                      <span className="text-xs text-gray-500 font-medium">Call Status:</span>
                      <div className="flex gap-2 items-center">
                        <a
                          href={`tel:${p.userPhone}`}
                          className="p-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                          title="Call User"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                        </a>
                        <button
                          onClick={() => updateCallStatus(p.userId, "picked")}
                          className={`flex-1 px-1 py-1.5 rounded-full text-[10px] font-medium uppercase tracking-wide transition-all ${p.lastCallStatus === "picked"
                            ? "bg-green-600 text-white shadow-md ring-1 ring-green-200"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                            }`}
                        >
                          Picked
                        </button>
                        <button
                          onClick={() => updateCallStatus(p.userId, "not_picked")}
                          className={`flex-1 px-1 py-1.5 rounded-full text-[10px] font-medium uppercase tracking-wide transition-all ${p.lastCallStatus === "not_picked"
                            ? "bg-red-600 text-white shadow-md ring-1 ring-red-200"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                            }`}
                        >
                          Rejected
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(p, "pending")}
                        disabled={
                          p.pendingAmount === 0 ||
                          collecting[`${p.userId}-pending`]
                        }
                        className={`flex-1 py-2 rounded text-sm ${p.pendingAmount === 0 ||
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
                        className={`flex-1 py-2 rounded text-sm ${p.rentCollected || collecting[`${p.userId}-rent`]
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
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount to Collect
              </label>
              <input
                type="number"
                value={amountToCollect}
                onChange={(e) => setAmountToCollect(Number(e.target.value))}
                max={currentPayment.amount}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 text-lg font-bold text-green-700"
              />
              <p className="text-xs text-gray-500 mt-1">
                Total Due: ₹{currentPayment.amount.toLocaleString("en-IN")}
              </p>
            </div>

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
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UTR Number
                </label>
                <input
                  type="text"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  placeholder="Enter UTR / Ref Number"
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmCollect}
                disabled={collecting[`${currentPayment.userId}-${currentPayment.collectType}`]}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {collecting[`${currentPayment.userId}-${currentPayment.collectType}`]
                  ? "Processing..."
                  : "Confirm Collect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;

