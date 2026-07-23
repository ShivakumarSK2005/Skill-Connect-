import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import api from "../Services/api";

const isStartWindowExpired = (booking) => {
  if (!["confirmed", "pending_start"].includes(booking.status)) {
    return false;
  }

  const bookingTime = new Date(booking.booking_date).getTime();
  const oneHour = 60 * 60 * 1000;

  return Number.isFinite(bookingTime) && Date.now() - bookingTime > oneHour;
};

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [myReviews, setMyReviews] = useState([]);
  const [ratingDrafts, setRatingDrafts] = useState({});
  const [reviewOverrides, setReviewOverrides] = useState({});
  const [reviewErrors, setReviewErrors] = useState({});
  const [actionBookingId, setActionBookingId] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const [bookingsRes, reviewsRes] = await Promise.all([
        api.get("/bookings/my"),
        api.get("/reviews/my")
      ]);
      const bookingList = Array.isArray(bookingsRes.data)
        ? bookingsRes.data
        : Array.isArray(bookingsRes.data?.data)
          ? bookingsRes.data.data
          : [];
      const reviewList = Array.isArray(reviewsRes.data)
        ? reviewsRes.data
        : Array.isArray(reviewsRes.data?.data)
          ? reviewsRes.data.data
          : [];

      setBookings(bookingList);
      setMyReviews(reviewList);
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to load your bookings."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => filter === "all" || booking.status === filter);
  }, [bookings, filter]);

  const handleBookingAction = async (bookingId, endpoint, successText) => {
    try {
      setActionBookingId(bookingId);
      setMessage({ type: "", text: "" });
      await api.put(`/bookings/${bookingId}/${endpoint}`);
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
      setActionBookingId(null);
    }
  };

  const handleReviewDraftChange = (bookingId, field, value) => {
    setReviewErrors((current) => {
      if (!current[bookingId]) {
        return current;
      }

      const next = { ...current };
      delete next[bookingId];
      return next;
    });

    setRatingDrafts((current) => ({
      ...current,
      [bookingId]: {
        rating: current[bookingId]?.rating || "",
        comment: current[bookingId]?.comment || "",
        [field]: value
      }
    }));
  };

  const applyReviewToBooking = (bookingId, review) => {
    setReviewOverrides((current) => ({
      ...current,
      [bookingId]: {
        rating: review.rating,
        comment: review.comment,
        reviewedAt: review.reviewedAt
      }
    }));

    setBookings((current) =>
      current.map((booking) =>
        booking.booking_id === bookingId
          ? {
              ...booking,
              user_rating: review.rating,
              user_comment: review.comment,
              user_reviewed_at: review.reviewedAt
            }
          : booking
      )
    );

    setRatingDrafts((current) => {
      const next = { ...current };
      delete next[bookingId];
      return next;
    });

    setReviewErrors((current) => {
      if (!current[bookingId]) {
        return current;
      }

      const next = { ...current };
      delete next[bookingId];
      return next;
    });
  };

  const getBookingReview = (booking) => {
    const override = reviewOverrides[booking.booking_id];

    if (override) {
      return override;
    }

    const matchedReview =
      myReviews.find((review) => Number(review.booking_id) === Number(booking.booking_id)) ||
      myReviews.find(
        (review) =>
          !review.booking_id && Number(review.service_id) === Number(booking.service_id)
      );

    if (matchedReview) {
      return {
        rating: matchedReview.rating,
        comment: matchedReview.comment,
        reviewedAt: matchedReview.created_at
      };
    }

    const hasBackendRating =
      booking.user_rating !== null &&
      booking.user_rating !== undefined &&
      booking.user_rating !== "";

    if (!hasBackendRating) {
      return null;
    }

    return {
      rating: booking.user_rating,
      comment: booking.user_comment,
      reviewedAt: booking.user_reviewed_at
    };
  };

  const findReviewForBooking = (bookingId, serviceId, reviews = myReviews) =>
    reviews.find((review) => Number(review.booking_id) === Number(bookingId)) ||
    reviews.find(
      (review) =>
        !review.booking_id && Number(review.service_id) === Number(serviceId)
    ) ||
    null;

  const submitReview = async (bookingId) => {
    const draft = ratingDrafts[bookingId] || {};
    const booking = bookings.find((item) => item.booking_id === bookingId);

    if (!draft.rating) {
      setReviewErrors((current) => ({
        ...current,
        [bookingId]: "Please select a rating before submitting."
      }));
      return;
    }

    try {
      setActionBookingId(bookingId);
      setReviewErrors((current) => {
        if (!current[bookingId]) {
          return current;
        }

        const next = { ...current };
        delete next[bookingId];
        return next;
      });
      await api.post("/reviews", {
        booking_id: bookingId,
        rating: Number(draft.rating),
        comment: draft.comment || ""
      });
      applyReviewToBooking(bookingId, {
        rating: Number(draft.rating),
        comment: draft.comment || "",
        reviewedAt: new Date().toISOString()
      });
      setMessage({ type: "success", text: "Review submitted successfully." });
      await fetchBookings();
    } catch (err) {
      const errorText =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to submit review.";

      if (errorText.toLowerCase().includes("already reviewed")) {
        try {
          const reviewsRes = await api.get("/reviews/my");
          const reviewList = Array.isArray(reviewsRes.data)
            ? reviewsRes.data
            : Array.isArray(reviewsRes.data?.data)
              ? reviewsRes.data.data
              : [];
          setMyReviews(reviewList);

          const savedReview = findReviewForBooking(bookingId, booking?.service_id, reviewList);

          if (savedReview) {
            applyReviewToBooking(bookingId, {
              rating: savedReview.rating,
              comment: savedReview.comment,
              reviewedAt: savedReview.created_at
            });
          }
        } catch (_refreshError) {
          // Keep the message below, but don't block the user if the refresh fails.
        }

        setMessage({ type: "", text: "" });
        await fetchBookings();
        return;
      }

      setReviewErrors((current) => ({
        ...current,
        [bookingId]: errorText
      }));
    } finally {
      setActionBookingId(null);
    }
  };

  return (
    <div className="app-shell">
      <Navbar />

      <main className="content-shell">
        <section className="hero-panel compact-panel">
          <div>
            <span className="chip">Customer bookings</span>
            <h2>Track every service from request to completion.</h2>
            <p>Cancel pending work, confirm provider start, and review completed bookings.</p>
          </div>

          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending_start">Pending start</option>
            <option value="started">Started</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </section>

        {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

        {loading ? (
          <LoadingState label="Loading your bookings..." />
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            title="No bookings found"
            description="Your bookings will appear here once you reserve a service."
          />
        ) : (
          <section className="stack-grid">
            {filteredBookings.map((booking) => {
              const draft = ratingDrafts[booking.booking_id] || { rating: "", comment: "" };
              const isBusy = actionBookingId === booking.booking_id;
              const startExpired = isStartWindowExpired(booking);
              const review = getBookingReview(booking);
              const reviewError = reviewErrors[booking.booking_id];

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
                      <span className="label">Provider</span>
                      <p>{booking.provider_name}</p>
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

                  <div className="action-row">
                    {booking.status === "pending" && (
                      <button
                        className="btn btn-danger"
                        disabled={isBusy}
                        onClick={() => handleBookingAction(booking.booking_id, "cancel", "Booking cancelled.")}
                      >
                        Cancel booking
                      </button>
                    )}

                    {booking.status === "pending_start" && !startExpired && (
                      <button
                        className="btn btn-primary"
                        disabled={isBusy}
                        onClick={() => handleBookingAction(booking.booking_id, "confirm-start", "Work marked as started.")}
                      >
                        Confirm start
                      </button>
                    )}
                  </div>

                  {startExpired && (
                    <div className="inline-note danger-note">
                      This booking has crossed the allowed start window and should be treated as expired.
                    </div>
                  )}

                  {booking.status === "completed" && !review && (
                    <div className="review-panel">
                      <h4>Add your review</h4>
                      <div className="review-form-grid">
                        <select
                          value={draft.rating}
                          onChange={(event) =>
                            handleReviewDraftChange(booking.booking_id, "rating", event.target.value)
                          }
                        >
                          <option value="">Select rating</option>
                          <option value="1">1 star</option>
                          <option value="2">2 stars</option>
                          <option value="3">3 stars</option>
                          <option value="4">4 stars</option>
                          <option value="5">5 stars</option>
                        </select>

                        <textarea
                          placeholder="Share your experience"
                          value={draft.comment}
                          onChange={(event) =>
                            handleReviewDraftChange(booking.booking_id, "comment", event.target.value)
                          }
                        />
                      </div>

                      <button
                        className="btn btn-primary"
                        disabled={isBusy}
                        onClick={() => submitReview(booking.booking_id)}
                      >
                        Submit review
                      </button>

                      {reviewError && <p className="field-error">{reviewError}</p>}
                    </div>
                  )}

                  {booking.status === "completed" && review && (
                    <div className="review-summary">
                      <span className="label">Your rating</span>
                      <strong>{review.rating} / 5</strong>
                      {review.reviewedAt && (
                        <p className="muted-text">
                          Reviewed on {new Date(review.reviewedAt).toLocaleString()}
                        </p>
                      )}
                      {review.comment && <p>{review.comment}</p>}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

export default Bookings;
