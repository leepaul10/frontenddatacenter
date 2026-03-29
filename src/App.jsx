import React, { useState } from "react";
import axios from "axios";

const API_URL = "https://data-center-energy-prediction.onrender.com/predict";

const BUILDING_DATA = {
  203: { site_id: 2, primary_use: 4, square_feet: 63348, year_built: 2007 },
  150: { site_id: 1, primary_use: 1, square_feet: 50000, year_built: 1995 },
  101: { site_id: 0, primary_use: 0, square_feet: 10300, year_built: 1976 },
};

const FIELD_LIMITS = {
  air_temp: { min: -25.6, max: 47.2 },
  dew_temp: { min: -29.4, max: 25.6 },
  cloud_cov: { min: 0, max: 9 },
  precip: { min: -1.0, max: 333.0 },
  wind_speed: { min: 0.0, max: 16.0 },
  wind_dir: { min: 0.0, max: 360.0 },
  lag_1h: { min: 0.02, max: 9070.27 },
  lag_24h: { min: 0.03, max: 10565.3 },
  lag_48h: { min: 0.11, max: 11767.0 },
};

export default function App() {
  const [selectedId, setSelectedId] = useState(203);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null); // changed from [0,0,0] to null
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const buildingRow = BUILDING_DATA[selectedId];

  const [formData, setFormData] = useState({
    meter: 0,
    meter_reading: "",
    hour: 12,
    month: 1,
    day: 1,
    weekday: 0,
    air_temp: "",
    dew_temp: "",
    cloud_cov: "",
    precip: "",
    wind_speed: "",
    wind_dir: "",
    lag_1h: "",
    lag_24h: "",
    lag_48h: "",
  });

  const validateField = (name, value) => {
    if (value === "" || value === null) return true;
    if (FIELD_LIMITS[name]) {
      const { min, max } = FIELD_LIMITS[name];
      if (value < min || value > max) {
        setModalMessage(
          `${name.replace("_", " ")} must be between ${min} and ${max}`
        );
        setShowModal(true);
        return false;
      }
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, Number(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    for (let field in FIELD_LIMITS) {
      if (!validateField(field, formData[field])) return;
    }

    setLoading(true);

    const payload = {
      building_id: selectedId,
      meter: Number(formData.meter || 0),
      meter_reading: Number(formData.meter_reading || 0),
      site_id: buildingRow.site_id,
      primary_use: buildingRow.primary_use,
      square_feet: buildingRow.square_feet,
      year_built: buildingRow.year_built,
      air_temperature: Number(formData.air_temp || 0),
      cloud_coverage: Number(formData.cloud_cov || 0),
      dew_temperature: Number(formData.dew_temp || 0),
      precip_depth_1_hr: Number(formData.precip || 0),
      sea_level_pressure: 1013,
      wind_direction: Number(formData.wind_dir || 0),
      wind_speed: Number(formData.wind_speed || 0),
      hour: Number(formData.hour || 0),
      day: Number(formData.day || 0),
      weekday: Number(formData.weekday || 0),
      month: Number(formData.month || 0),
      lag_1h: Number(formData.lag_1h || 0),
      lag_24h: Number(formData.lag_24h || 0),
      lag_48h: Number(formData.lag_48h || 0),
    };

    try {
      const res = await axios.post(API_URL, payload, {
        headers: { "Content-Type": "application/json" },
      });

      const forecast = res.data?.forecast;
      if (forecast) {
        setPrediction([
          Number(forecast.t_plus_1h),
          Number(forecast.t_plus_24h),
          Number(forecast.t_plus_48h),
        ]);
      } else {
        setPrediction(null); // only show result after click
        alert("Prediction returned invalid data");
      }
    } catch (err) {
      console.error(err);
      alert("Server error or waking up!");
      setPrediction(null);
    }

    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>⚡ Data Center Energy Prediction</h1>

      <div style={styles.layout}>
        <div style={styles.sidebar}>
          <h3>🏢 Building Settings</h3>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            style={styles.select}
          >
            {Object.keys(BUILDING_DATA).map((id) => (
              <option key={id}>{id}</option>
            ))}
          </select>

          <div style={styles.info}>
            <b>Metadata (Auto-filled)</b>
            <p>Primary Use: {buildingRow.primary_use}</p>
            <p>Square Feet: {buildingRow.square_feet.toLocaleString()}</p>
            <p>Year Built: {buildingRow.year_built}</p>
            <p>Site ID: {buildingRow.site_id}</p>
            <hr />
            <i>Selected Building: {selectedId}</i>
          </div>
        </div>

        <div style={styles.main}>
          <form onSubmit={handleSubmit}>
            <h3>🌡️ Forecast Parameters</h3>
            <div style={styles.row}>
              <div style={styles.col}>
                <label>Meter Type</label>
                <select
                  name="meter"
                  onChange={handleChange}
                  value={formData.meter}
                  style={styles.input}
                >
                  {[0, 1, 2, 3].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>

                <label>Meter Reading</label>
                <input
                  type="number"
                  name="meter_reading"
                  value={formData.meter_reading}
                  onChange={handleChange}
                  style={styles.input}
                />

                <label>Hour: {formData.hour}</label>
                <input
                  type="range"
                  name="hour"
                  min="0"
                  max="23"
                  value={formData.hour}
                  onChange={handleChange}
                  style={styles.slider}
                />
              </div>

              <div style={styles.col}>
                <label>Month: {formData.month}</label>
                <input
                  type="range"
                  name="month"
                  min="1"
                  max="12"
                  value={formData.month}
                  onChange={handleChange}
                  style={styles.slider}
                />
                <label>Day: {formData.day}</label>
                <input
                  type="range"
                  name="day"
                  min="1"
                  max="31"
                  value={formData.day}
                  onChange={handleChange}
                  style={styles.slider}
                />
                <label>Weekday: {formData.weekday}</label>
                <input
                  type="range"
                  name="weekday"
                  min="0"
                  max="6"
                  value={formData.weekday}
                  onChange={handleChange}
                  style={styles.slider}
                />
              </div>
            </div>

            <hr style={styles.hr} />
            <h4>🌩️ Weather Conditions</h4>
            <div style={styles.row}>
              {Object.keys(FIELD_LIMITS)
                .filter((f) => !f.startsWith("lag"))
                .map((field) => (
                  <div key={field} style={{ flex: 1 }}>
                    <label>
                      {field.replace("_", " ")} (
                      {FIELD_LIMITS[field].min}-{FIELD_LIMITS[field].max})
                    </label>
                    <input
                      type="number"
                      name={field}
                      value={formData[field]}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      style={styles.input}
                    />
                  </div>
                ))}
            </div>

            <hr style={styles.hr} />
            <h4>📈 History (Lags)</h4>
            <div style={styles.row}>
              {Object.keys(FIELD_LIMITS)
                .filter((f) => f.startsWith("lag"))
                .map((field) => (
                  <div key={field} style={{ flex: 1 }}>
                    <label>
                      {field} ({FIELD_LIMITS[field].min}-{FIELD_LIMITS[field].max})
                    </label>
                    <input
                      type="number"
                      name={field}
                      value={formData[field]}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      style={styles.input}
                    />
                  </div>
                ))}
            </div>

            <button style={styles.button} type="submit">
              {loading ? "Predicting..." : "Run Prediction"}
            </button>
          </form>

          {/* Predictions - only show after click */}
          {prediction && (
            <div style={styles.resultRow}>
              {["T+1 Hour", "T+24 Hours", "T+48 Hours"].map((t, i) => (
                <div key={i} style={styles.card}>
                  {t}
                  <br />
                  <b>{prediction[i]?.toFixed(2) || 0} kWh</b>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <p>{modalMessage}</p>
            <button
              style={styles.modalButton}
              onClick={() => setShowModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles (unchanged)
const styles = {
  page: {
    background: "#0e1117",
    color: "white",
    minHeight: "100vh",
    padding: 20,
    fontFamily: "sans-serif",
    margin:30,
    borderRadius:20,
  },
  title: { textAlign: "center", marginBottom: 50 ,marginTop: 20},
  layout: { display: "flex", flexWrap: "wrap", gap: 20 },
  sidebar: {
    flex: "0 0 260px",
    background: "#262730",
    padding: 20,
    borderRadius: 10,
  },
  select: { width: "100%", padding: 10, marginBottom: 20 },
  info: {
    background: "#1e3a8a",
    padding: 15,
    borderRadius: 8,
    transition: "0.3s",
  },
  main: {
    flex: 1,
    background: "#262730",
    padding: 20,
    borderRadius: 10,
    minWidth: 300,
  },
  row: { display: "flex", flexWrap: "wrap", gap: 15, marginBottom: 15 },
  col: { flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 150 },
  input: {
    padding: 10,
    background: "#0e1117",
    border: "1px solid #444",
    borderRadius: 6,
    color: "white",
    transition: "0.3s",
    outline: "none",
    cursor: "pointer",
  },
  slider: { accentColor: "#ff4b4b" },
  button: {
    width: "100%",
    padding: 15,
    background: "#ff4b4b",
    border: "none",
    borderRadius: 8,
    color: "white",
    cursor: "pointer",
    transition: "0.3s",
  },
  hr: { margin: "20px 0", opacity: 0.2 },
  resultRow: { display: "flex", flexWrap: "wrap", gap: 15, marginTop: 20 },
  card: {
    flex: 1,
    minWidth: 120,
    background: "#1e3a8a",
    padding: 20,
    borderRadius: 10,
    textAlign: "center",
    transition: "0.3s",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#262730",
    padding: 30,
    borderRadius: 10,
    color: "white",
    textAlign: "center",
    maxWidth: 400,
  },
  modalButton: {
    marginTop: 20,
    padding: 10,
    background: "#ff4b4b",
    border: "none",
    borderRadius: 6,
    color: "white",
    cursor: "pointer",
  },
};