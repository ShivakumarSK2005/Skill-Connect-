import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../Services/api";

const initialRange = {
  start_date: "",
  end_date: ""
};

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [range, setRange] = useState(initialRange);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchBookings = async (nextFilter = filter, nextRange = range) => {
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });
      const params = { filter: nextFilter };

      if (nextRange.start_date) {
        params.start_date = nextRange.start_date;
      }

      if (nextRange.end_date) {
        params.end_date = nextRange.end_date;
      }

      const res = await api.get("/admin/bookings", { params });
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      setBookings(list);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || err.response?.data?.error || "Unable to load bookings."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const stats = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter((booking) => booking.status === "pending").length,
      completed: bookings.filter((booking) => booking.status === "completed").length
    }),
    [bookings]
  );

  const handlePresetChange = (event) => {
    const nextFilter = event.target.value;
    setFilter(nextFilter);
    fetchBookings(nextFilter, range);
  };

  const handleRangeChange = (event) => {
    const { name, value } = event.target;
    setRange((current) => ({ ...current, [name]: value }));
  };

  const applyCustomRange = () => {
    fetchBookings(filter, range);
  };

  return (
    <div className="app-shell">
      <Navbar />

      <main className="content-shell">
        <section className="hero-panel">
          <div>
            <span className="chip">Bookings</span>
            <h2>See all bookings with date filters.</h2>
            <p>
              Filter bookings by today, this week, this month, this year, or pick a
              custom start and end date.
            </p>
          </div>

          <div className="hero-meta provider-stats">
            <div>
              <strong>{stats.total}</strong>
              <span>Total bookings</span>
            </div>
            <div>
              <strong>{stats.pending}</strong>
              <span>Pending</span>
            </div>
            <div>
              <strong>{stats.completed}</strong>
              <span>Completed</span>
            </div>
          </div>
        </section>

        {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

        <section className="panel-card">
          <div className="panel-head panel-head-inline">
            <div>
              <p className="section-kicker">Booking filters</p>
              <h3>Choose duration</h3>
            </div>

            <select value={filter} onChange={handlePresetChange}>
              <option value="all">All bookings</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="year">This year</option>
            </select>
          </div>

          <div className="toolbar-panel">
            <label>
              <span>Start date</span>
              <input
                name="start_date"
                type="date"
                value={range.start_date}
                onChange={handleRangeChange}
              />
            </label>

            <label>
              <span>End date</span>
              <input
                name="end_date"
                type="date"
                value={range.end_date}
                onChange={handleRangeChange}
              />
            </label>

            <button className="btn btn-primary" type="button" onClick={applyCustomRange}>
              Apply range
            </button>
          </div>

          {loading ? (
            <p className="muted-text">Loading bookings...</p>
          ) : bookings.length === 0 ? (
            <p className="muted-text">No bookings found for this filter.</p>
          ) : (
            <div className="stack-grid">
              {bookings.map((booking) => (
                <article className="market-card booking-card" key={booking.booking_id}>
                  <div className="card-topline">
                    <div>
                      <span className="category-pill">{booking.category || "General"}</span>
                      <h3>{booking.service_name || "Service"}</h3>
                    </div>
                    <span className={`status-badge ${booking.status}`}>{booking.status}</span>
                  </div>

                  <div className="booking-meta-grid">
                    <div>
                      <span className="label">Customer</span>
                      <p>{booking.customer_name || "Unknown"}</p>
                    </div>
                    <div>
                      <span className="label">Provider</span>
                      <p>{booking.provider_name || "Unknown"}</p>
                    </div>
                    <div>
                      <span className="label">Booking date</span>
                      <p>{new Date(booking.booking_date).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="label">Created</span>
                      <p>{new Date(booking.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="label">Customer phone</span>
                      <p>{booking.customer_phone || "Not available"}</p>
                    </div>
                    <div>
                      <span className="label">Provider phone</span>
                      <p>{booking.provider_phone || "Not available"}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminBookings;
