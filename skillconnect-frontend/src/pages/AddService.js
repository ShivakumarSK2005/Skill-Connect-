import React, { useEffect, useState } from "react";
import api from "../Services/api";
import Navbar from "../components/Navbar";
import "../styles/global.css";

/**
 * WHAT IT DOES:
 *   Service creation form for providers. Fetches platform categories, collects service title,
 *   description, and pricing, and submits the new listing to `/api/services`.
 * 
 * WHY WE ADDED IT:
 *   - Provider Skill Listing: Allows providers to publish new offerings under recognized categories.
 * 
 * HOW IT WORKS:
 *   1. `useEffect` loads categories from `/api/services/categories`.
 *   2. Form state binds inputs for `category_id`, `service_name`, `description`, and `price`.
 *   3. `handleSubmit` validates fields and dispatches POST request.
 *   4. Redirects to `/provider-dashboard` upon creation.
 */
function AddService() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    category_id: "",
    service_name: "",
    description: "",
    price: ""
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/api/services/categories");
        setCategories(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!form.category_id || !form.service_name.trim() || !form.price) {
      alert("Please select a category, enter a service name, and enter a price");
      return;
    }

    try {
      await api.post("/api/services", {
        category_id: Number(form.category_id),
        service_name: form.service_name.trim(),
        title: form.service_name.trim(),
        description: form.description,
        price: Number(form.price)
      });

      alert("Service added successfully");
      window.location.href = "/provider-dashboard";
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || "Failed to add service");
    }
  };

  return (
    <>
      <Navbar role="provider" />

      <div className="form-container">
        <h2>Add Service</h2>

        <div className="form-group">
          <label>Category</label>
          <select
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Service Name</label>
          <input
            type="text"
            name="service_name"
            value={form.service_name}
            onChange={handleChange}
            placeholder="e.g. Pipe Repair, Tap Installation"
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="4"
          />
        </div>

        <div className="form-group">
          <label>Price</label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            min="1"
          />
        </div>

        <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleSubmit}>
          Save Service
        </button>
      </div>
    </>
  );
}

export default AddService;
