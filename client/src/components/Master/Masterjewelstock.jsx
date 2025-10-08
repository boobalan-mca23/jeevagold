import React, { useState, useEffect } from "react";
import "./masterjewelstock.css";
import { BACKEND_SERVER_URL } from "../../Config/Config";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatNumber } from "../../utils/formatNumber";
import { formatToFixed3Strict } from "../../utils/formatToFixed3Strict";
import { NumericFormat } from "react-number-format";

const Masterjewelstock = () => {
  const [formData, setFormData] = useState({
    jewelName: "",
    weight: "",
    stoneWeight: "",
    finalWeight: "",
    touch: "",
    purityValue: "",
  });

  const [entries, setEntries] = useState([]);
  const [showFormPopup, setShowFormPopup] = useState(false);
  const [totalPurity, setTotalPurity] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await fetch(`${BACKEND_SERVER_URL}/api/jewel-stock`);
      if (!response.ok) throw new Error("Failed to fetch entries");
      const data = await response.json();
      setEntries(data);
      calculateTotalPurity(data);
    } catch (error) {
      console.error(error);
      toast.error("Error fetching entries.");
    }
  };

  const calculateTotalPurity = (entries) => {
    const total = entries.reduce(
      (sum, entry) => sum + parseFloat(entry.purityValue || 0),
      0
    );
    setTotalPurity(formatToFixed3Strict(total));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name !== "jewelName") {
      const isValid = /^(\d+\.?\d*|\.\d*)?$/.test(value);
      if (!isValid && value !== "") return;
    }

    const updatedData = {
      ...formData,
      [name]: value,
    };

    const weight = parseFloat(updatedData.weight) || 0;
    const stoneWeight = parseFloat(updatedData.stoneWeight) || 0;
    const touch = parseFloat(updatedData.touch) || 0;

    const finalWeight = weight - stoneWeight;
    updatedData.finalWeight = formatToFixed3Strict(finalWeight);

    updatedData.purityValue =
      finalWeight && touch ? formatToFixed3Strict((finalWeight * touch) / 100) : "";

    setFormData(updatedData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isEditMode
        ? `${BACKEND_SERVER_URL}/api/jewel-stock/${editId}`
        : `${BACKEND_SERVER_URL}/api/jewel-stock`;

      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save entry");

      const newEntry = await response.json();

      let updatedEntries;
      if (isEditMode) {
        updatedEntries = entries.map((entry) =>
          entry.id === editId ? newEntry : entry
        );
        toast.success("Entry updated successfully!");
      } else {
        updatedEntries = [...entries, newEntry];
        toast.success("Stock added successfully!");
      }

      setEntries(updatedEntries);
      calculateTotalPurity(updatedEntries);
      resetForm();
      setShowFormPopup(false);
    } catch (error) {
      console.error(error);
      toast.error("Error saving entry.");
    }
  };

  const resetForm = () => {
    setFormData({
      jewelName: "",
      weight: "",
      stoneWeight: "",
      finalWeight: "",
      touch: "",
      purityValue: "",
    });
    setIsEditMode(false);
    setEditId(null);
  };

  const handleEdit = (entry) => {
    setFormData({
      jewelName: entry.jewelName,
      weight: entry.weight,
      stoneWeight: entry.stoneWeight,
      finalWeight: entry.finalWeight,
      touch: entry.touch,
      purityValue: entry.purityValue,
    });
    setEditId(entry.id);
    setIsEditMode(true);
    setShowFormPopup(true);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this entry?"
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `${BACKEND_SERVER_URL}/api/jewel-stock/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete entry");

      const updatedEntries = entries.filter((entry) => entry.id !== id);
      setEntries(updatedEntries);
      calculateTotalPurity(updatedEntries);
      toast.success("Entry deleted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Error deleting entry.");
    }
  };

  return (
    <div className="master-jewel-stock">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2>Jewel Stock</h2>
      <button className="add-btn" onClick={() => setShowFormPopup(true)}>
        Add Jewel Stock
      </button>

      {showFormPopup && (
        <div className="popup-overlay">
          <div className="popup-contentsss">
            <h3>{isEditMode ? "Edit" : "Enter"} Jewel Stock Details</h3>
            <button
              className="close-btnss"
              onClick={() => {
                setShowFormPopup(false);
                resetForm();
              }}
            >
              ×
            </button>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Jewel Name:</label>
                <input
                  type="text"
                  name="jewelName"
                  value={formData.jewelName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Weight (grams):</label>
                <NumericFormat
                  name="weight"
                  value={formData.weight}
                  onValueChange={(values) => {
                    handleChange({
                      target: {
                        name: "weight",
                        value: values.floatValue,
                      },
                    });
                  }}
                  thousandSeparator=","
                  decimalScale={3}
                  allowNegative={false}
                  required
                />
              </div>

              <div className="form-group">
                <label>Stone Weight (grams):</label>
                <NumericFormat
                  name="stoneWeight"
                  value={formData.stoneWeight}
                  onValueChange={(values) => {
                    handleChange({
                      target: {
                        name: "stoneWeight",
                        value: values.floatValue,
                      },
                    });
                  }}
                  thousandSeparator=","
                  decimalScale={3}
                  allowNegative={false}
                />
              </div>

              <div className="form-group">
                <label>Final Weight (grams):</label>
                <NumericFormat
                  name="finalWeight"
                  value={formData.finalWeight}
                  onValueChange={(values) => {
                    if (isEditMode) {
                      handleChange({
                        target: {
                          name: "finalWeight",
                          value: values.floatValue,
                        },
                      });
                    }
                  }}
                  thousandSeparator=","
                  decimalScale={3}
                  allowNegative={false}
                  readOnly={!isEditMode}
                  className={!isEditMode ? "read-only" : ""}
                />
              </div>

              <div className="form-group">
                <label>Touch (%):</label>
                <NumericFormat
                  name="touch"
                  value={formData.touch}
                  onValueChange={(values) => {
                    handleChange({
                      target: {
                        name: "touch",
                        value: values.floatValue,
                      },
                    });
                  }}
                  thousandSeparator=","
                  decimalScale={2}
                  allowNegative={false}
                  isAllowed={(values) => {
                    const { floatValue } = values;
                    return (
                      floatValue === undefined ||
                      (floatValue >= 0 && floatValue <= 100)
                    );
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label>Purity Value (grams):</label>
                <NumericFormat
                  name="purityValue"
                  value={formData.purityValue}
                  onValueChange={(values) => {
                    if (isEditMode) {
                      handleChange({
                        target: {
                          name: "purityValue",
                          value: values.floatValue,
                        },
                      });
                    }
                  }}
                  thousandSeparator=","
                  decimalScale={3}
                  allowNegative={false}
                  readOnly={!isEditMode}
                  className={!isEditMode ? "read-only" : ""}
                />
              </div>

              <div className="button-group">
                <button type="submit" className="submit-btn">
                  {isEditMode ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="entries-section">
        <h3>Jewel Stock Entries</h3>
        {entries.length === 0 ? (
          <p>No entries yet. Please add some jewel stock entries.</p>
        ) : (
          <table className="entries-table">
            <thead>
              <tr>
                <th>SI. No.</th>
                <th>Jewel Name</th>
                <th>Weight (g)</th>
                <th>Stone Wt. (g)</th>
                <th>Final Wt. (g)</th>
                <th>Touch (%)</th>
                <th>Purity (g)</th>
                <th>Edit</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={entry.id}>
                  <td>{index + 1}</td>
                  <td>{entry.jewelName}</td>
                  <td>{formatToFixed3Strict(entry.weight)}</td>
                  <td>{formatToFixed3Strict(entry.stoneWeight)}</td>
                  <td>{formatToFixed3Strict(entry.finalWeight)}</td>
                  <td>{formatNumber(entry.touch, 2)}</td>
                  <td>{formatToFixed3Strict(entry.purityValue)}</td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(entry)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                  </td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(entry.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td
                  colSpan="6"
                  style={{ textAlign: "right", fontWeight: "bold" }}
                >
                  Total Purity:
                </td>
                <td colSpan="3" style={{ fontWeight: "bold" }}>
                  {formatToFixed3Strict(totalPurity)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};

export default Masterjewelstock;
