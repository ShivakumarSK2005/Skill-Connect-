import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import api from "../Services/api";

const activeStatuses = ["pending", "confirmed", "pending_start", "started"];

const isStartWindowExpired = (booking) => {
  if (!["confirmed", "pending_start"].includes(booking.status)) {
    return false;
  }

  const bookingTime = new Date(booking.booking_date).getTime();
  const oneHour = 60 * 60 * 1000;

  return Number.isFinite(bookingTime) && Date.now() - bookingTime > oneHour;
};

function ProviderDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [actionId, setActionId] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const bookingRes = await api.get("/bookings/provider");
      const list = Array.isArray(bookingRes.data)
        ? bookingRes.data
        : Array.isArray(bookingRes.data?.data)
          ? bookingRes.data.data
          : [];

      setBookings(list.filter((booking) => activeStatuses.includes(booking.status)));
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to load active provider bookings."
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
      inProgress: bookings.filter((booking) => ["confirmed", "pending_start", "started"].includes(booking.status)).length
    };
  }, [bookings]);

  const handleBookingAction = async (bookingId, endpoint, payload, successText) => {
    try {
      setActionId(`booking-${bookingId}`);
      setMessage({ type: "", text: "" });
      await api.put(`/bookings/${bookingId}/${endpoint}`, payload || {});
      setMessage({ type: "success", text: successText });
      await fetchBookings();
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

  return (
    <div className="app-shell">
      <Navbar />

      <main className="content-shell">
        <section className="hero-panel provider-hero">
          <div>
            <span className="chip">Provider dashboard</span>
            <h2>Focus on active bookings only.</h2>
            <p>
              This dashboard keeps only bookings that are still in progress. Completed, cancelled, and expired bookings move to the Bookings page.
            </p>
          </div>
          <div className="hero-meta provider-stats">
            <div>
              <strong>{bookingStats.pending}</strong>
              <span>Pending bookings</span>
            </div>
            <div>
              <strong>{bookingStats.inProgress}</strong>
              <span>In progress</span>
            </div>
            <div>
              <strong>{bookingStats.total}</strong>
              <span>Active bookings</span>
            </div>
          </div>
        </section>

        {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

        {loading ? (
          <LoadingState label="Loading active provider bookings..." />
        ) : (
          <section className="panel-card booking-flow-panel">
            <div className="panel-head">
              <div>
                <p className="section-kicker">Active bookings</p>
                <h3>Bookings that still need action</h3>
              </div>
            </div>

            {bookings.length === 0 ? (
              <EmptyState
                title="No active bookings"
                description="Completed or closed bookings are available from the separate Bookings page."
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

export default ProviderDashboard;
