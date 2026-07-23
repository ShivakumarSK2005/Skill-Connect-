import { useEffect, useRef, useState } from "react";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import Navbar from "../components/Navbar";
import api from "../Services/api";

const initialServiceForm = {
  category_id: "",
  service_name: "",
  description: "",
  price: ""
};

function ProviderServices() {
  const formSectionRef = useRef(null);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialServiceForm);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formError, setFormError] = useState("");
  const [actionId, setActionId] = useState(null);

  const fetchPageData = async () => {
    try {
      setLoading(true);
      const [servicesRes, categoriesRes] = await Promise.all([
        api.get("/services/my"),
        api.get("/services/categories")
      ]);

      const serviceList = Array.isArray(servicesRes.data)
        ? servicesRes.data
        : servicesRes.data?.data || [];
      const categoryList = Array.isArray(categoriesRes.data)
        ? categoriesRes.data
        : categoriesRes.data?.data || [];

      setServices(
        [...serviceList].sort((a, b) => {
          const aId = Number(a.id || 0);
          const bId = Number(b.id || 0);
          return bId - aId;
        })
      );
      setCategories(categoryList);
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to load your services."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, []);

  const handleServiceInput = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFormError("");
  };

  const resetServiceForm = () => {
    setForm(initialServiceForm);
    setEditingServiceId(null);
    setFormError("");
  };

  const startEditService = (service) => {
    const matchedCategory = categories.find(
      (item) => Number(item.id) === Number(service.category_id) || item.name === service.category
    );

    setForm({
      category_id: matchedCategory ? String(matchedCategory.id) : "",
      service_name: service.service_name || "",
      description: service.description || "",
      price: String(service.price || "")
    });
    setEditingServiceId(service.id);
    setFormError("");
    setMessage({ type: "", text: "" });
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSaveService = async (event) => {
    event.preventDefault();
    const selectedCategoryId = Number(form.category_id);
    const priceValue = Number(form.price);
    const trimmedServiceName = form.service_name.trim();

    if (
      !Number.isInteger(selectedCategoryId) ||
      selectedCategoryId <= 0 ||
      !trimmedServiceName ||
      !Number.isFinite(priceValue) ||
      priceValue <= 0
    ) {
      setFormError("Please select a category, enter a service type, and enter a price.");
      return;
    }

    try {
      const targetId = editingServiceId ? `service-${editingServiceId}` : "service-create";
      setActionId(targetId);
      setFormError("");
      setMessage({ type: "", text: "" });

      const payload = {
        category_id: selectedCategoryId,
        service_name: trimmedServiceName,
        description: form.description,
        price: priceValue
      };

      if (editingServiceId) {
        await api.put(`/services/${editingServiceId}`, payload);
        setMessage({ type: "success", text: "Service updated successfully." });
      } else {
        await api.post("/services", payload);
        setMessage({ type: "success", text: "Service added successfully." });
      }

      resetServiceForm();
      await fetchPageData();
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to save service."
      });
    } finally {
      setActionId(null);
    }
  };

  const handleDeleteService = async (serviceId) => {
    try {
      setActionId(`delete-${serviceId}`);
      setMessage({ type: "", text: "" });
      await api.delete(`/services/${serviceId}`);
      if (editingServiceId === serviceId) {
        resetServiceForm();
      }
      setMessage({ type: "success", text: "Service removed successfully." });
      await fetchPageData();
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to remove service."
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
            <span className="chip">Provider services</span>
            <h2>Add, edit, and remove only your own services.</h2>
            <p>
              Pick a category first, then enter the exact service type you offer like Pipe Repair or Fan Repair.
            </p>
          </div>
          <div className="hero-meta provider-stats">
            <div>
              <strong>{services.length}</strong>
              <span>Your services</span>
            </div>
            <div>
              <strong>{services.filter((service) => Number(service.total_reviews || 0) > 0).length}</strong>
              <span>Reviewed services</span>
            </div>
            <div>
              <strong>{categories.length}</strong>
              <span>Categories</span>
            </div>
          </div>
        </section>

        {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

        {loading ? (
          <LoadingState label="Loading your services..." />
        ) : (
          <div className="provider-dashboard-stack">
            <section className="panel-card" ref={formSectionRef}>
              <div className="panel-head">
                <div>
                  <p className="section-kicker">Service form</p>
                  <h3>{editingServiceId ? "Edit service" : "Add a new service"}</h3>
                </div>
              </div>

              <form className="stack-form" onSubmit={handleSaveService}>
                <label>
                  <span>Category</span>
                  <select
                    name="category_id"
                    value={form.category_id}
                    onChange={handleServiceInput}
                  >
                    <option value="">Select category</option>
                    {categories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Service type</span>
                  <input
                    name="service_name"
                    type="text"
                    value={form.service_name}
                    onChange={handleServiceInput}
                    placeholder="Pipe Repair"
                  />
                </label>

                <label>
                  <span>Description</span>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleServiceInput}
                    placeholder="Describe the work you provide"
                  />
                </label>

                <label>
                  <span>Price</span>
                  <input
                    name="price"
                    type="number"
                    value={form.price}
                    onChange={handleServiceInput}
                    placeholder="500"
                  />
                </label>

                <div className="action-row wrap">
                  <button
                    className="btn btn-primary"
                    disabled={actionId === "service-create" || actionId === `service-${editingServiceId}`}
                  >
                    {editingServiceId ? "Update service" : "Add service"}
                  </button>
                  {editingServiceId && (
                    <button className="btn btn-secondary" type="button" onClick={resetServiceForm}>
                      Cancel edit
                    </button>
                  )}
                </div>
                {formError && <span className="field-error">{formError}</span>}
              </form>
            </section>

            <section className="panel-card">
              <div className="panel-head">
                <div>
                  <p className="section-kicker">Your services</p>
                  <h3>Manage only your listed services</h3>
                </div>
              </div>

              {services.length === 0 ? (
                <EmptyState
                  title="No services added yet"
                  description="Create your first service to become bookable on the marketplace."
                />
              ) : (
                <div className="stack-grid">
                  {services.map((service) => (
                    <article className="market-card provider-service-card" key={service.id}>
                      <div className="card-topline">
                        <div>
                          <span className="category-pill">{service.category}</span>
                          <h3>{service.service_name}</h3>
                        </div>
                        <div className="service-price-block">Rs. {service.price}</div>
                      </div>

                      <p className="card-description">
                        {service.description || "No description added yet."}
                      </p>

                      <div className="service-stats-row">
                        <span>{Number(service.avg_rating || 0).toFixed(1)} / 5 rating</span>
                        <span>{Number(service.total_reviews || 0)} reviews</span>
                      </div>

                      <div className="action-row wrap">
                        <button
                          className="btn btn-secondary"
                          type="button"
                          onClick={() => startEditService(service)}
                        >
                          Edit service
                        </button>
                        <button
                          className="btn btn-danger"
                          type="button"
                          disabled={actionId === `delete-${service.id}`}
                          onClick={() => handleDeleteService(service.id)}
                        >
                          Remove service
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default ProviderServices;
