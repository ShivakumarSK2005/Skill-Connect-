import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../Services/api";

function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchData = async () => {
    try {
      setLoading(true);
      const servicesRes = await api.get("/admin/services");
      setServices(Array.isArray(servicesRes.data) ? servicesRes.data : servicesRes.data?.data || []);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || err.response?.data?.error || "Unable to load services."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (serviceId) => {
    try {
      setActionId(serviceId);
      setMessage({ type: "", text: "" });
      await api.delete(`/admin/services/${serviceId}`);
      setMessage({ type: "success", text: "Service removed successfully." });
      await fetchData();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || err.response?.data?.error || "Unable to remove service."
      });
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="app-shell">
      <Navbar />

      <main className="content-shell">
        <section className="hero-panel">
          <div>
            <span className="chip">Services</span>
            <h2>Remove marketplace services safely.</h2>
            <p>
              Admin can hide provider services from the marketplace here. Existing booking
              records stay preserved in the database.
            </p>
          </div>

          <div className="hero-meta provider-stats">
            <div>
              <strong>{services.length}</strong>
              <span>Active services</span>
            </div>
          </div>
        </section>

        {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

        <section className="panel-card">
          <div className="panel-head">
            <div>
              <p className="section-kicker">Service list</p>
              <h3>Active provider services</h3>
            </div>
          </div>

          {loading ? (
            <p className="muted-text">Loading services...</p>
          ) : services.length === 0 ? (
            <p className="muted-text">No active services found.</p>
          ) : (
            <div className="mini-service-list">
              {services.map((service) => (
                <article className="mini-service-item" key={service.id}>
                  <div>
                    <strong>{service.service_name || "Untitled service"}</strong>
                    <p>{service.category_name || "No category assigned"}</p>
                    <p>Provider: {service.provider_name || "Unknown"}</p>
                    <p>Phone: {service.phone || "Not available"}</p>
                    <p>Price: Rs. {service.price}</p>
                    {service.description && <p>{service.description}</p>}
                  </div>
                  <button
                    className="btn btn-danger"
                    type="button"
                    disabled={actionId === service.id}
                    onClick={() => handleDelete(service.id)}
                  >
                    Remove
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminServices;
