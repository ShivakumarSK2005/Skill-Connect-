import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import api from "../Services/api";

const initialRange = {
  start_date: "",
  end_date: ""
};

const isStartWindowExpired = (booking) => {
  if (!["confirmed", "pending_start"].includes(booking.status)) {
    return false;
  }

  const bookingTime = new Date(booking.booking_date).getTime();
  const oneHour = 60 * 60 * 1000;

  return Number.isFinite(bookingTime) && Date.now() - bookingTime > oneHour;
};

function ProviderBookings() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [range, setRange] = useState(initialRange);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [actionId, setActionId] = useState(null);

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

      const bookingRes = await api.get("/bookings/provider", { params });
      const list = Array.isArray(bookingRes.data)
        ? bookingRes.data
        : Array.isArray(bookingRes.data?.data)
          ? bookingRes.data.data
          : [];
      setBookings(list);
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to load provider bookings."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const bookingStats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter((booking) => booking.status === "pending").length,
      completed: bookings.filter((booking) => booking.status === "completed").length
    };
  }, [bookings]);

  const handleBookingAction = async (bookingId, endpoint, payload, successText) => {
    try {
      setActionId(`booking-${bookingId}`);
      setMessage({ type: "", text: "" });
      await api.put(`/bookings/${bookingId}/${endpoint}`, payload || {});
      setMessage({ type: "success", text: successText });
      await fetchBookings(filter, range);
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to update booking."
      });
    } finally {
      setActionId(null);
    }
  };

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
        <section className="hero-panel provider-hero">
          <div>
            <span className="chip">Provider bookings</span>
            <h2>See all bookings for your services.</h2>
            <p>
              Filter bookings by today, this week, this month, this year, or use a custom date range.
            </p>
          </div>
          <div className="hero-meta provider-stats">
            <div>
              <strong>{bookingStats.pending}</strong>
              <span>Pending bookings</span>
            </div>
            <div>
              <strong>{bookingStats.completed}</strong>
              <span>Completed</span>
            </div>
            <div>
              <strong>{bookingStats.total}</strong>
              <span>Total bookings</span>
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
        </section>

        {loading ? (
          <LoadingState label="Loading provider bookings..." />
        ) : (
          <section className="panel-card booking-flow-panel">
            <div className="panel-head">
              <div>
                <p className="section-kicker">Incoming bookings</p>
                <h3>All bookings for your services</h3>
              </div>
            </div>

            {bookings.length === 0 ? (
              <EmptyState
                title="No bookings found"
                description="Bookings matching this filter will appear here."
              />
            ) : (
              <div className="stack-grid">
                {bookings.map((booking) => {
                  const isBusy = actionId === `booking-${booking.booking_id}`;
                  const startExpired = isStartWindowExpired(booking);

                  return (
                    <article className="market-card booking-card" key={booking.booking_id}>
                      <div className="card-topline">
                        <div>
                          <span className="category-pill">{booking.category}</span>
                          <h3>{booking.service_name}</h3>
                        </div>
                        <StatusBadge status={booking.status} />
                      </div>

                      <div className="booking-meta-grid">
                        <div>
                          <span className="label">Customer</span>
                          <p>{booking.customer_name}</p>
                        </div>
                        <div>
                          <span className="label">Phone</span>
                          <p>{booking.phone || "Not available"}</p>
                        </div>
                        <div>
                          <span className="label">Booking date</span>
                          <p>{new Date(booking.booking_date).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="label">Created</span>
                          <p>{new Date(booking.created_at).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="action-row wrap">
                        {booking.status === "pending" && (
                          <>
                            <button
                              className="btn btn-primary"
                              disabled={isBusy}
                              onClick={() =>
                                handleBookingAction(
                                  booking.booking_id,
                                  "status",
                                  { status: "confirmed" },
                                  "Booking confirmed."
                                )
                              }
                            >
                              Accept
                            </button>
                            <button
                              className="btn btn-danger"
                              disabled={isBusy}
                              onClick={() =>
                                handleBookingAction(
                                  booking.booking_id,
                                  "status",
                                  { status: "cancelled" },
                                  "Booking cancelled."
                                )
                              }
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {booking.status === "confirmed" && !startExpired && (
                          <button
                            className="btn btn-secondary"
                            disabled={isBusy}
                            onClick={() =>
                              handleBookingAction(
                                booking.booking_id,
                                "request-start",
                                {},
                                "Start request sent to customer."
                              )
                            }
                          >
                            Request start
                          </button>
                        )}

                        {booking.status === "started" && (
                          <button
                            className="btn btn-primary"
                            disabled={isBusy}
                            onClick={() =>
                              handleBookingAction(
                                booking.booking_id,
                                "complete",
                                {},
                                "Booking marked as completed."
                              )
                            }
                          >
                            Mark completed
                          </button>
                        )}
                      </div>

                      {startExpired && (
                        <div className="inline-note danger-note">
                          Start window expired for this booking. Start-related actions are hidden.
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default ProviderBookings;
