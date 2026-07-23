import React, { useEffect, useState } from "react";
import api from "../Services/api";
import Navbar from "../components/Navbar";
import "../styles/global.css";

function AddService() {
  const [serviceTypes, setServiceTypes] = useState([]);
  const [form, setForm] = useState({
    service_type_id: "",
    description: "",
    price: ""
  });

  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        const res = await api.get("/api/services/types");
        setServiceTypes(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching service types:", err);
      }
    };

    fetchServiceTypes();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!form.service_type_id || !form.price) {
      alert("Please select a service type and enter a price");
      return;
    }

    try {
      await api.post("/api/services", {
        service_type_id: Number(form.service_type_id),
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
          <label>Service Type</label>
          <select
            name="service_type_id"
            value={form.service_type_id}
            onChange={handleChange}
          >
            <option value="">Select service type</option>
            {serviceTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} - {type.category}
              </option>
            ))}
          </select>
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
