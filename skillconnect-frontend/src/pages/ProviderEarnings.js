import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import Navbar from "../components/Navbar";
import api from "../Services/api";
import "../styles/global.css";

/**
 * WHAT IT DOES:
 *   Financial and earnings analytics portal for service providers.
 *   Provides high-level KPI cards (Total Revenue, Completed Jobs, Avg Ticket Size),
 *   interactive time-period filter pills (This Week, This Month, Last Month, Individual Years, All Time),
 *   an adaptive revenue trend bar chart with SVG/CSS dynamic bars, top revenue-generating skills,
 *   and an itemized transaction ledger.
 * 
 * WHY WE ADDED IT:
 *   - Financial Visibility: Enables professionals to track their income, spot seasonal trends,
 *     and evaluate which services yield the highest returns.
 *   - Dynamic Scale Adaptation: Automatically adjusts chart resolution (days for week, weeks for month,
 *     months for year, years for all-time) and left-aligns bars when fewer than 6 data points exist.
 * 
 * HOW IT WORKS:
 *   1. `fetchEarnings()` requests `/api/bookings/provider/earnings` passing `period` and `selectedYear`.
 *   2. `availableYears` generates year selection buttons dynamically starting from provider's registration year.
 *   3. `chartConfig` processes raw transactions into chart bars with proportional percentage heights.
 *   4. Displays top services ranked by revenue share and a detailed audit log of completed transactions.
 */
function ProviderEarnings() {
  const [data, setData] = useState({
    summary: {
      totalEarnings: 0,
      completedJobs: 0,
      avgPerJob: 0,
      rating: "5.0",
      joinedYear: new Date().getFullYear(),
      currentYear: new Date().getFullYear()
    },
    monthlyBreakdown: [],
    topServices: [],
    transactions: []
  });

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/bookings/provider/earnings?period=${period}&year=${selectedYear}`
      );
      setData(res.data);
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to load earnings data."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, selectedYear]);

  const availableYears = useMemo(() => {
    const start = data.summary.joinedYear || new Date().getFullYear();
    const end = data.summary.currentYear || new Date().getFullYear();
    const years = [];
    for (let y = end; y >= start; y--) {
      years.push(y);
    }
    return years;
  }, [data.summary.joinedYear, data.summary.currentYear]);

  const chartConfig = useMemo(() => {
    const transactions = data.transactions || [];

    // Case 1: "This Week" -> Show Mon, Tue, Wed, Thu, Fri, Sat, Sun
    if (period === "week") {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const dayEarnings = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
      const dayJobs = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

      transactions.forEach((tx) => {
        const d = new Date(tx.booking_date);
        const dayIdx = d.getDay(); // 0 is Sun, 1 is Mon...
        const dayName = dayIdx === 0 ? "Sun" : days[dayIdx - 1];
        if (dayEarnings[dayName] !== undefined) {
          dayEarnings[dayName] += Number(tx.price || 0);
          dayJobs[dayName] += 1;
        }
      });

      const bars = days.map((day) => ({
        name: day,
        fullName: `${day}day`,
        earnings: dayEarnings[day],
        jobs: dayJobs[day]
      }));

      const max = Math.max(...bars.map((b) => b.earnings), 1);
      return {
        title: "Daily Revenue (This Week)",
        subtitle: "Earnings by day of the week",
        bars,
        max
      };
    }

    // Case 2: "This Month" or "Last Month" -> Show Weeks of Month
    if (period === "month" || period === "last_month") {
      const weekLabels = ["Week 1 (1-7)", "Week 2 (8-14)", "Week 3 (15-21)", "Week 4 (22-28)", "Week 5 (29+)"];
      const weekEarnings = [0, 0, 0, 0, 0];
      const weekJobs = [0, 0, 0, 0, 0];

      transactions.forEach((tx) => {
        const dateNum = new Date(tx.booking_date).getDate();
        let wIdx = 0;
        if (dateNum <= 7) wIdx = 0;
        else if (dateNum <= 14) wIdx = 1;
        else if (dateNum <= 21) wIdx = 2;
        else if (dateNum <= 28) wIdx = 3;
        else wIdx = 4;

        weekEarnings[wIdx] += Number(tx.price || 0);
        weekJobs[wIdx] += 1;
      });

      const bars = weekLabels.map((lbl, idx) => ({
        name: `W${idx + 1}`,
        fullName: lbl,
        earnings: weekEarnings[idx],
        jobs: weekJobs[idx]
      }));

      const max = Math.max(...bars.map((b) => b.earnings), 1);
      const title = period === "last_month" ? "Weekly Revenue (Last Month)" : "Weekly Revenue (This Month)";
      return {
        title,
        subtitle: "Earnings progression across weeks",
        bars,
        max
      };
    }

    // Case 3: "All Time" -> Show Year-Over-Year Growth
    if (period === "all") {
      const yearMap = {};
      const jobMap = {};
      availableYears.forEach((yr) => {
        yearMap[yr] = 0;
        jobMap[yr] = 0;
      });

      transactions.forEach((tx) => {
        const yr = new Date(tx.booking_date).getFullYear();
        if (yearMap[yr] !== undefined) {
          yearMap[yr] += Number(tx.price || 0);
          jobMap[yr] += 1;
        }
      });

      const bars = [...availableYears].reverse().map((yr) => ({
        name: String(yr),
        fullName: `Year ${yr}`,
        earnings: yearMap[yr] || 0,
        jobs: jobMap[yr] || 0
      }));

      const max = Math.max(...bars.map((b) => b.earnings), 1);
      return {
        title: "Yearly Growth (All Time)",
        subtitle: "Annual revenue since starting with us",
        bars,
        max
      };
    }

    // Case 4: Default / Selected Year -> 12 Months
    const bars = (data.monthlyBreakdown || []).map((m) => ({
      name: m.name,
      fullName: `${m.name} ${selectedYear}`,
      earnings: Number(m.earnings || 0),
      jobs: Number(m.jobs || 0)
    }));

    const max = Math.max(...bars.map((b) => b.earnings), 1);
    return {
      title: `Monthly Revenue (${selectedYear})`,
      subtitle: "12-month earnings trend",
      bars,
      max
    };
  }, [period, selectedYear, data.transactions, data.monthlyBreakdown, availableYears]);

  const summary = data.summary || {};

  return (
    <div className="app-shell">
      <Navbar />

      <main className="content-shell">
        {/* Top Hero Panel */}
        <section className="hero-panel provider-hero">
          <div>
            <span className="chip">Provider financial hub</span>
            <h2>Earnings & Revenue Performance</h2>
            <p>
              Track your completed jobs, payout history, and skill performance across time periods.
            </p>
          </div>
          <div
            className="hero-meta provider-stats"
            style={{ gridTemplateColumns: "repeat(3, minmax(120px, 1fr))" }}
          >
            <div>
              <strong>Rs. {Number(summary.totalEarnings || 0).toLocaleString()}</strong>
              <span>Total revenue</span>
            </div>
            <div>
              <strong>{summary.completedJobs || 0}</strong>
              <span>Completed jobs</span>
            </div>
            <div>
              <strong>Rs. {Number(summary.avgPerJob || 0).toLocaleString()}</strong>
              <span>Avg per job</span>
            </div>
          </div>
        </section>

        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        {/* Time Period Filter Panel */}
        <section className="panel-card" style={{ marginBottom: "20px" }}>
          <div
            className="panel-head"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px"
            }}
          >
            <div>
              <p className="section-kicker">Time Period</p>
              <h3>Filter your journey</h3>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                className={`btn ${period === "week" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "8px 14px", fontSize: "13px" }}
                onClick={() => setPeriod("week")}
              >
                This Week
              </button>

              <button
                type="button"
                className={`btn ${period === "month" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "8px 14px", fontSize: "13px" }}
                onClick={() => setPeriod("month")}
              >
                This Month
              </button>

              <button
                type="button"
                className={`btn ${period === "last_month" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "8px 14px", fontSize: "13px" }}
                onClick={() => setPeriod("last_month")}
              >
                Last Month
              </button>

              {availableYears.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  className={`btn ${
                    period === "selected_year" && selectedYear === yr
                      ? "btn-primary"
                      : "btn-secondary"
                  }`}
                  style={{ padding: "8px 14px", fontSize: "13px" }}
                  onClick={() => {
                    setSelectedYear(yr);
                    setPeriod("selected_year");
                  }}
                >
                  {yr === summary.currentYear
                    ? `${yr} (Current)`
                    : yr === summary.joinedYear
                    ? `${yr} (Joined)`
                    : yr}
                </button>
              ))}

              <button
                type="button"
                className={`btn ${period === "all" ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "8px 14px", fontSize: "13px" }}
                onClick={() => setPeriod("all")}
              >
                All Time
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <LoadingState label="Calculating your earnings..." />
        ) : (
          <>
            {/* Visual Breakdown Grid */}
            <div
              className="card-grid two-column"
              style={{ marginBottom: "20px" }}
            >
              {/* Adaptive Revenue Trend */}
              <section className="panel-card">
                <div className="panel-head">
                  <div>
                    <p className="section-kicker">Revenue Trend</p>
                    <h3>{chartConfig.title}</h3>
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                    {chartConfig.subtitle}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: chartConfig.bars.length < 6 ? "flex-start" : "space-between",
                    height: "170px",
                    paddingTop: "24px",
                    gap: chartConfig.bars.length < 6 ? "28px" : "6px",
                    paddingLeft: "8px"
                  }}
                >
                  {chartConfig.bars.map((bar) => {
                    const heightPercent =
                      chartConfig.max > 0
                        ? Math.max(8, Math.round((bar.earnings / chartConfig.max) * 100))
                        : 8;

                    return (
                      <div
                        key={bar.name}
                        style={{
                          flex: chartConfig.bars.length < 6 ? "0 0 48px" : 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          height: "100%",
                          justifyContent: "flex-end"
                        }}
                        title={`${bar.fullName || bar.name}: Rs. ${bar.earnings.toLocaleString()} (${bar.jobs} jobs)`}
                      >
                        <div
                          style={{
                            width: "100%",
                            maxWidth: "32px",
                            height: `${heightPercent}%`,
                            background:
                              bar.earnings > 0
                                ? "linear-gradient(180deg, var(--primary), var(--primary-dark))"
                                : "rgba(15, 23, 42, 0.08)",
                            borderRadius: "6px 6px 0 0",
                            transition: "height 0.3s ease"
                          }}
                        />
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--muted)",
                            marginTop: "6px",
                            fontWeight: bar.earnings > 0 ? 600 : 400
                          }}
                        >
                          {bar.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Top Earning Services */}
              <section className="panel-card">
                <div className="panel-head">
                  <div>
                    <p className="section-kicker">Performance by skill</p>
                    <h3>Top Earning Services</h3>
                  </div>
                </div>

                {data.topServices.length === 0 ? (
                  <EmptyState
                    title="No completed jobs"
                    description="Services will show earnings once customers complete bookings."
                  />
                ) : (
                  <div className="stack-grid">
                    {data.topServices.slice(0, 4).map((s) => (
                      <article
                        className="market-card"
                        key={s.service_name}
                        style={{ padding: "14px 18px" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "8px"
                          }}
                        >
                          <div>
                            <span className="category-pill">{s.category}</span>
                            <h4 style={{ margin: "4px 0 0" }}>{s.service_name}</h4>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <strong style={{ fontSize: "16px" }}>
                              Rs. {Number(s.earnings).toLocaleString()}
                            </strong>
                            <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>
                              {s.jobs} {s.jobs === 1 ? "job" : "jobs"}
                            </p>
                          </div>
                        </div>

                        {/* Visual Percentage Bar */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "11px",
                            color: "var(--muted)",
                            marginBottom: "5px"
                          }}
                        >
                          <span>Share of revenue</span>
                          <strong>{s.percentage}%</strong>
                        </div>
                        <div
                          style={{
                            width: "100%",
                            height: "6px",
                            background: "rgba(15, 23, 42, 0.08)",
                            borderRadius: "999px",
                            overflow: "hidden"
                          }}
                        >
                          <div
                            style={{
                              width: `${s.percentage}%`,
                              height: "100%",
                              background: "var(--primary)"
                            }}
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Detailed Transaction History */}
            <section className="panel-card">
              <div className="panel-head">
                <div>
                  <p className="section-kicker">Payout statement</p>
                  <h3>Completed Booking Ledger</h3>
                </div>
              </div>

              {data.transactions.length === 0 ? (
                <EmptyState
                  title="No completed transactions"
                  description="Completed bookings for this time period will appear in this ledger."
                />
              ) : (
                <div className="stack-grid">
                  {data.transactions.map((tx) => (
                    <article
                      className="market-card booking-card"
                      key={tx.booking_id}
                    >
                      <div className="card-topline">
                        <div>
                          <span className="category-pill">{tx.category}</span>
                          <h3>{tx.service_name}</h3>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span
                            className="chip"
                            style={{
                              background: "rgba(16, 185, 129, 0.15)",
                              color: "#065f46",
                              fontWeight: 700,
                              fontSize: "15px"
                            }}
                          >
                            + Rs. {Number(tx.price).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="booking-meta-grid">
                        <div>
                          <span className="label">Booking ID</span>
                          <p>#{tx.booking_id}</p>
                        </div>
                        <div>
                          <span className="label">Customer</span>
                          <p>{tx.customer_name}</p>
                        </div>
                        <div>
                          <span className="label">Customer Phone</span>
                          <p>{tx.phone || "Not available"}</p>
                        </div>
                        <div>
                          <span className="label">Service Date</span>
                          <p>{new Date(tx.booking_date).toLocaleString()}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default ProviderEarnings;
