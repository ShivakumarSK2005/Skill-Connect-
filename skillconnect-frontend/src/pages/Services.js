import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import Navbar from "../components/Navbar";
import api from "../Services/api";

function Services() {
  const [services, setServices] = useState([]);
  const [bookingDates, setBookingDates] = useState({});
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [minRating, setMinRating] = useState("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [submittingId, setSubmittingId] = useState(null);
  const [bookingErrors, setBookingErrors] = useState({});
  const [selectedService, setSelectedService] = useState(null);
  const [serviceReviews, setServiceReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const res = await api.get("/services");
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];
        setServices(list);
      } catch (err) {
        setMessage({
          type: "error",
          text:
            err.response?.data?.message ||
            err.response?.data?.error ||
            "Unable to load services right now."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const categories = useMemo(() => {
    return ["all", ...new Set(services.map((service) => service.category).filter(Boolean))];
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        `${service.service_name} ${service.provider_name} ${service.description || ""}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesCategory = category === "all" || service.category === category;
      const ratingValue = Number(service.avg_rating || 0);
      const matchesRating = minRating === "all" || ratingValue >= Number(minRating);

      return matchesSearch && matchesCategory && matchesRating;
    });
  }, [services, search, category, minRating]);

  const handleDateChange = (serviceId, value) => {
    setBookingDates((current) => ({ ...current, [serviceId]: value }));
    setBookingErrors((current) => ({ ...current, [serviceId]: "" }));
  };

  const handleBook = async (serviceId) => {
    const bookingDate = bookingDates[serviceId];

    if (!bookingDate) {
      setBookingErrors((current) => ({
        ...current,
        [serviceId]: "Please select a time slot."
      }));
      return;
    }

    if (new Date(bookingDate) <= new Date()) {
      setBookingErrors((current) => ({
        ...current,
        [serviceId]: "Booking date must be in the future."
      }));
      return;
    }

    try {
      setSubmittingId(serviceId);
      setBookingErrors((current) => ({ ...current, [serviceId]: "" }));
      setMessage({ type: "", text: "" });
      await api.post("/bookings", {
        service_id: serviceId,
        booking_date: bookingDate
      });
      setMessage({ type: "success", text: "Booking created successfully." });
    } catch (err) {
      setBookingErrors((current) => ({
        ...current,
        [serviceId]:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to create booking."
      }));
    } finally {
      setSubmittingId(null);
    }
  };

  const openServiceDetails = async (service) => {
    setSelectedService(service);
    setReviewsLoading(true);

    try {
      const res = await api.get(`/reviews/service/${service.id}`);
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      setServiceReviews(list);
    } catch (err) {
      setServiceReviews([]);
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to load service reviews."
      });
    } finally {
      setReviewsLoading(false);
    }
  };

  const closeServiceDetails = () => {
    setSelectedService(null);
    setServiceReviews([]);
  };

  return (
    <div className="app-shell">
      <Navbar />

      <main className="content-shell">
        <section className="hero-panel">
          <div>
            <span className="chip">Customer workspace</span>
            <h2>Book trusted experts for everyday needs.</h2>
            <p>
              Search services, compare providers, and schedule work with a booking flow
              that tracks every status clearly.
            </p>
          </div>
          <div className="hero-meta">
            <div>
              <strong>{services.length}</strong>
              <span>Services listed</span>
            </div>
            <div>
              <strong>{categories.length - 1}</strong>
              <span>Categories</span>
            </div>
          </div>
        </section>

        <section className="toolbar-panel">
          <input
            className="search-input"
            placeholder="Search by service, provider, or keyword"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All categories" : item}
              </option>
            ))}
          </select>

          <select value={minRating} onChange={(event) => setMinRating(event.target.value)}>
            <option value="all">All ratings</option>
            <option value="4">4 stars and above</option>
            <option value="3">3 stars and above</option>
            <option value="2">2 stars and above</option>
          </select>
        </section>

        {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

        {loading ? (
          <LoadingState label="Loading available services..." />
        ) : filteredServices.length === 0 ? (
          <EmptyState
            title="No services available"
            description="Try a different filter or ask a provider to add services."
          />
        ) : (
          <section className="card-grid two-column">
            {filteredServices.map((service) => {
              const rating = Number(service.avg_rating || 0);
              const totalReviews = Number(service.total_reviews || 0);

              return (
                <article className="market-card" key={service.id}>
                  <div className="card-topline">
                    <span className="category-pill">{service.category}</span>
                    <span className="rating-pill">
                      {rating > 0 ? `${rating.toFixed(1)} / 5` : "New"}
                      <small>{totalReviews > 0 ? `${totalReviews} reviews` : "No reviews yet"}</small>
                    </span>
                  </div>

                  <h3>{service.service_name}</h3>
                  <p className="provider-line">{service.provider_name} • {service.phone || "Phone unavailable"}</p>
                  <p className="card-description">
                    {service.description || "Professional service with flexible booking."}
                  </p>

                  <button
                    className="text-link-btn"
                    onClick={() => openServiceDetails(service)}
                    type="button"
                  >
                    View reviews and details
                  </button>

                  <div className="card-footer-row">
                    <div>
                      <span className="label">Price</span>
                      <strong className="price-tag">Rs. {service.price}</strong>
                    </div>
                    <div className="booking-box">
                      <span className="label">Select time slot</span>
                      <input
                        type="datetime-local"
                        value={bookingDates[service.id] || ""}
                        onChange={(event) => handleDateChange(service.id, event.target.value)}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={() => handleBook(service.id)}
                        disabled={submittingId === service.id}
                      >
                        {submittingId === service.id ? "Booking..." : "Book Now"}
                      </button>
                      {bookingErrors[service.id] && (
                        <span className="field-error">{bookingErrors[service.id]}</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {selectedService && (
          <section className="panel-card review-explorer">
            <div className="details-header">
              <div>
                <p className="section-kicker">Service details</p>
                <h3>{selectedService.service_name}</h3>
                <p className="muted-text">
                  {selectedService.provider_name} • {selectedService.category}
                </p>
              </div>
              <button className="btn btn-secondary" onClick={closeServiceDetails} type="button">
                Close
              </button>
            </div>

            <div className="details-summary-grid">
              <div>
                <span className="label">Provider phone</span>
                <p>{selectedService.phone || "Not available"}</p>
              </div>
              <div>
                <span className="label">Average rating</span>
                <p>
                  {Number(selectedService.avg_rating || 0) > 0
                    ? `${Number(selectedService.avg_rating).toFixed(1)} / 5`
                    : "No ratings yet"}
                </p>
              </div>
              <div>
                <span className="label">Description</span>
                <p>{selectedService.description || "No description added."}</p>
              </div>
            </div>

            <div className="review-list-wrap">
              <h4>Customer reviews</h4>
              {reviewsLoading ? (
                <LoadingState label="Loading reviews..." />
              ) : serviceReviews.length === 0 ? (
                <EmptyState
                  title="No reviews yet"
                  description="This service has not received any review comments yet."
                />
              ) : (
                <div className="stack-grid">
                  {serviceReviews.map((review) => (
                    <div className="review-item" key={review.id}>
                      <div className="review-item-head">
                        <strong>{review.customer_name}</strong>
                        <span>{review.rating} / 5</span>
                      </div>
                      <p className="muted-text">
                        {new Date(review.created_at).toLocaleString()}
                      </p>
                      <p>{review.comment || "No written comment provided."}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default Services;
