import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Cashgold.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BACKEND_SERVER_URL } from "../../Config/Config";
import { formatNumber } from "../../utils/formatNumber";
import { formatToFixed3Strict } from "../../utils/formatToFixed3Strict";
import { NumericFormat } from "react-number-format";

function Cashgold() {
  const [showFormPopup, setShowFormPopup] = useState(false);
  const [entries, setEntries] = useState([]);
  const [goldRate, setGoldRate] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [bills, setBills] = useState([]);
  const [billPurityByDate, setBillPurityByDate] = useState({});

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "Select",
    cashAmount: "",
    goldValue: "",
    touch: "",
    purity: "",
    remarks: "",
  });

  const fetchbills = async () => {
    try {
      const res = await axios.get(`${BACKEND_SERVER_URL}/api/bills`);
      const billsData = res.data;

      const purityMap = {};

      billsData.forEach((bill) => {
        bill.receivedDetails.forEach((detail) => {
          const date = detail.date.split("T")[0];
          const purity = parseFloat(detail.purityWeight || 0);
          const paid = parseFloat(detail.paidAmount || 0);

          if (!purityMap[date]) purityMap[date] = 0;

          if (paid > 0) {
            purityMap[date] -= Math.abs(purity);
          } else {
            purityMap[date] += purity;
          }
        });
      });

      setBills(billsData);
      setBillPurityByDate(purityMap);
    } catch (error) {
      console.error("Failed to fetch bills", error);
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchbills();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await axios.get(`${BACKEND_SERVER_URL}/api/entries`);
      setEntries(response.data);
    } catch (error) {
      console.error("Error fetching entries:", error);
    }
  };

  const getMergedRows = () => {
    const rows = [];
    const dateSet = new Set();

    entries.forEach((entry) => {
      const entryDate = entry.date.split("T")[0];
      rows.push({ ...entry, isBillSummary: false });
      dateSet.add(entryDate);
    });

    Object.keys(billPurityByDate).forEach((date) => {
      const purity = billPurityByDate[date].toFixed(3);
      rows.push({
        date,
        type: "Gold",
        purity,
        isBillSummary: true,
      });
    });

    return rows.sort((a, b) => new Date(b.date) - new Date(a.date));
  };


  const handleChange = (e) => {
    const { name, value } = e.target;

    if (
      ["cashAmount", "goldValue", "touch", "purity", "goldRate"].includes(
        name
      ) &&
      parseFloat(value) < 0
    ) {
      toast.warning("Negative values are not allowed.");
      return;
    }

    const updatedForm = { ...formData, [name]: value };

    if (name === "goldValue" || name === "touch") {
      const goldValue = parseFloat(
        name === "goldValue" ? value : formData.goldValue
      );
      const touch = parseFloat(name === "touch" ? value : formData.touch);
      if (!isNaN(goldValue) && !isNaN(touch)) {
        updatedForm.purity = formatToFixed3Strict((goldValue * touch) / 100);
      } else {
        updatedForm.purity = "";
      }
    }

    setFormData(updatedForm);
  };

  useEffect(() => {
    if (formData.type === "Cash") {
      const cashAmount = parseFloat(formData.cashAmount);
      const rate = parseFloat(goldRate);
      if (!isNaN(cashAmount) && !isNaN(rate)) {
        setFormData((prev) => ({
          ...prev,
          purity: formatToFixed3Strict(cashAmount / rate),
        }));
      }
    }
  }, [formData.cashAmount, goldRate, formData.type]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.type === "Select") {
      toast.error("Please select a valid type: Cash or Gold");
      return;
    }

    if (formData.type === "Cash") {
      if (!formData.cashAmount || isNaN(formData.cashAmount)) {
        toast.error("Please enter a valid Cash Amount");
        return;
      }

      if (!goldRate || isNaN(goldRate)) {
        toast.error("Please enter a valid Gold Rate");
        return;
      }
    }

    if (formData.type === "Gold") {
      if (!formData.goldValue || isNaN(formData.goldValue)) {
        toast.error("Please enter a valid Gold Value");
        return;
      }

      if (!formData.touch || isNaN(formData.touch)) {
        toast.error("Please enter a valid Touch value");
        return;
      }
    }

    if (
      parseFloat(formData.cashAmount) < 0 ||
      parseFloat(formData.goldValue) < 0 ||
      parseFloat(formData.touch) < 0 ||
      parseFloat(formData.purity) < 0 ||
      parseFloat(goldRate) < 0
    ) {
      toast.error("Negative values are not allowed.");
      return;
    }

    const payload = {
      date: formData.date,
      type: formData.type,
      cashAmount:
        formData.type === "Cash" ? parseFloat(formData.cashAmount) : null,
      goldValue:
        formData.type === "Gold" ? parseFloat(formData.goldValue) : null,
      touch: formData.type === "Gold" ? parseFloat(formData.touch) : null,
      purity: parseFloat(formData.purity),
      goldRate: formData.type === "Cash" ? parseFloat(goldRate) : null,
      remarks: formData.remarks || null,
    };

    try {
      if (isEditMode) {
        await axios.put(`${BACKEND_SERVER_URL}/api/entries/${editId}`, payload);
        toast.success("Entry updated successfully!");
      } else {
        await axios.post(`${BACKEND_SERVER_URL}/api/entries`, payload);
        toast.success("Value added successfully!");
      }

      fetchEntries();
      setShowFormPopup(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to save entry.");
      console.error("Error submitting entry:", error);
    }
  };

  const handleEdit = (entry) => {
    setIsEditMode(true);
    setEditId(entry.id);
    setFormData({
      date: entry.date.split("T")[0],
      type: entry.type,
      cashAmount: entry.cashAmount || "",
      goldValue: entry.goldValue || "",
      touch: entry.touch || "",
      purity: entry.purity || "",
      remarks: entry.remarks || "",
    });
    setGoldRate(entry.goldRate || 0);
    setShowFormPopup(true);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this entry?"
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`${BACKEND_SERVER_URL}/api/entries/${id}`);
      toast.success("Entry deleted successfully!");
      fetchEntries();
    } catch (error) {
      toast.error("Failed to delete entry.");
      console.error("Error deleting entry:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      type: "Select",
      cashAmount: "",
      goldValue: "",
      touch: "",
      purity: "",
      remarks: "",
    });
    setGoldRate(0);
    setIsEditMode(false);
    setEditId(null);
  };

  const calculateTotalPurity = () => {
    return getMergedRows().reduce(
      (sum, entry) => sum + parseFloat(entry.purity || 0),
      0
    );
  };

  return (
    <div className="cashgold-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2>Cash/Gold</h2>
      <button className="add-btn" onClick={() => setShowFormPopup(true)}>
        Add Cash or Gold
      </button>

      {showFormPopup && (
        <div className="popup-overlay">
          <div className="popup-contentss">
            <h3>{isEditMode ? "Edit Entry" : "Enter Cash or Gold Details"}</h3>
            <button
              className="close-btns"
              onClick={() => {
                setShowFormPopup(false);
                resetForm();
              }}
            >
              ×
            </button>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Date:</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Type:</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="Select">Select</option>
                  <option value="Cash">Cash</option>
                  <option value="Gold">Gold</option>
                </select>
              </div>

              {formData.type === "Cash" && (
                <>
                  <div className="form-group">
                    <label>Cash Amount:</label>
                    <NumericFormat
                      name="cashAmount"
                      value={formData.cashAmount}
                      onValueChange={(values) => {
                        handleChange({
                          target: {
                            name: "cashAmount",
                            value: values.floatValue,
                          },
                        });
                      }}
                      thousandSeparator=","
                      decimalScale={2}
                      allowNegative={false}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Gold Rate (per gram):</label>
                    <NumericFormat
                      value={goldRate}
                      onValueChange={(values) => setGoldRate(values.floatValue)}
                      thousandSeparator=","
                      decimalScale={2}
                      allowNegative={false}
                      required
                    />
                  </div>
                </>
              )}

              {formData.type === "Gold" && (
                <>
                  <div className="form-group">
                    <label>Gold Value (g):</label>
                    <NumericFormat
                      name="goldValue"
                      value={formData.goldValue}
                      onValueChange={(values) => {
                        handleChange({
                          target: {
                            name: "goldValue",
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
                </>
              )}

              <div className="form-group">
                <label>Purity (g):</label>
                <NumericFormat
                  name="purity"
                  value={formData.purity}
                  onValueChange={(values) => {
                    if (isEditMode) {
                      handleChange({
                        target: {
                          name: "purity",
                          value: values.floatValue,
                        },
                      });
                    }
                  }}
                  thousandSeparator=","
                  decimalScale={3}
                  allowNegative={false}
                  readOnly={!isEditMode}
                  className={isEditMode ? "" : "read-only"}
                />
              </div>

              <div className="form-group">
                <label>Remarks:</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Enter description (optional)"
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
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
        <h3>Entries</h3>
        <table className="entries-table">
          <thead>
            <tr>
              <th>Sl. No.</th>
              <th>Date</th>
              <th>Type</th>
              <th>Amount/Value</th>
              <th>Touch/Rate</th>
              <th>Purity (g)</th>
              <th>Remarks</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {getMergedRows().map((entry, index) => (
              <tr
                key={index}
                className={entry.isBillSummary ? "bill-summary-row" : ""}
              >
                <td>{entry.isBillSummary ? "" : index + 1}</td>
                <td>{new Date(entry.date).toLocaleDateString("en-IN")}</td>
                <td>{entry.type}</td>
                <td>
                  {entry.isBillSummary
                    ? ""
                    : entry.type === "Cash"
                    ? `₹${formatNumber(entry.cashAmount, 2)}`
                    : `${formatToFixed3Strict(entry.goldValue)}g`}
                </td>
                <td>
                  {entry.isBillSummary
                    ? ""
                    : entry.type === "Cash"
                    ? `₹${formatNumber(entry.goldRate, 2)}/g`
                    : `${formatNumber(entry.touch, 2)}%`}
                </td>
                <td>{formatToFixed3Strict(entry.purity, 3)}</td>
                <td>{entry.isBillSummary ? "" : entry.remarks || "-"}</td>
                <td>
                  {!entry.isBillSummary && (
                    <>
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(entry)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(entry.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="footer-row">
              <td
                colSpan="5"
                style={{ textAlign: "right", fontWeight: "bold" }}
              >
                Total Purity:
              </td>
              <td style={{ fontWeight: "bold" }}>
                {formatToFixed3Strict(calculateTotalPurity(), 3)}
              </td>
              <td colSpan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default Cashgold;
