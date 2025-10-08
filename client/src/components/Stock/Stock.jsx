import React, { useState, useMemo, useEffect, useRef } from "react";
import "./Stock.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BACKEND_SERVER_URL } from "../../Config/Config";
import { formatNumber } from "../../utils/formatNumber";
import { formatToFixed3Strict } from "../../utils/formatToFixed3Strict";
import { NumericFormat } from "react-number-format";

const Stock = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [stockItems, setStockItems] = useState([]);
  const [filterCoinType, setFilterCoinType] = useState("");
  const [filterGram, setFilterGram] = useState("");
  const [formData, setFormData] = useState({
    coinType: "",
    gram: "",
    quantity: "",
    touch: "",
    totalWeight: "",
    purity: "",
  });
  const [editIndex, setEditIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const coinTypeRef = useRef(null);
  const gramRef = useRef(null);
  const quantityRef = useRef(null);
  const touchRef = useRef(null);
  const saveBtnRef = useRef(null);

  useEffect(() => {
    fetchStockItems();
  }, []);

  const fetchStockItems = async () => {
    try {
      const response = await fetch(`${BACKEND_SERVER_URL}/api/v1/stocks`);
      const data = await response.json();
      setStockItems(data);
    } catch (err) {
      console.error("Error fetching stocks:", err);
      toast.error("Failed to fetch stock items!");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedData = { ...formData, [name]: value };

    if (["gram", "quantity", "touch"].includes(name)) {
      const gram = parseFloat(updatedData.gram) || 0;
      const quantity = parseInt(updatedData.quantity) || 0;
      const touch = parseFloat(updatedData.touch) || 0;
      updatedData.totalWeight = formatToFixed3Strict(gram * quantity);
      updatedData.purity = formatToFixed3Strict((touch * gram * quantity) / 100);
    }

    setFormData(updatedData);
  };

  const handleSubmit = async () => {
    const decimalRegex = /^(\d+\.?\d*|\.\d+)?$/;

    if (
      !formData.coinType ||
      !formData.gram ||
      !formData.quantity ||
      !formData.touch
    ) {
      toast.error("Please fill in all required fields!");
      return;
    }

    if (
      !decimalRegex.test(formData.coinType) ||
      !decimalRegex.test(formData.gram) ||
      !decimalRegex.test(formData.quantity) ||
      !decimalRegex.test(formData.touch)
    ) {
      toast.error("Only numbers and a single decimal point are allowed.");
      return;
    }

    if (
      parseFloat(formData.coinType) < 0 ||
      parseFloat(formData.gram) < 0 ||
      parseFloat(formData.touch) < 0 ||
      parseFloat(formData.quantity) < 0
    ) {
      toast.error("Negative values are not allowed.");
      return;
    }

    try {
      if (editIndex !== null) {
        await handleUpdate();
      } else {
        await handleCreateOrUpdate();
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error("Operation failed!");
    }
  };

  const handleUpdate = async () => {
    try {
      const updatedItem = formData;
      const itemId = stockItems[editIndex].id;

      const response = await fetch(
        `${BACKEND_SERVER_URL}/api/v1/stocks/${itemId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedItem),
        }
      );

      if (!response.ok) throw new Error("Failed to update stock item");

      const result = await response.json();
      const updatedItems = [...stockItems];
      updatedItems[editIndex] = result.data;
      setStockItems(updatedItems);
      toast.success("Stock item updated successfully!");
      resetForm();
    } catch (err) {
      console.error("Error updating stock:", err);
      toast.error("Failed to update stock item!");
    }
  };

  const handleCreateOrUpdate = async () => {
    const existingItemIndex = stockItems.findIndex(
      (item) =>
        item.coinType === formData.coinType &&
        parseFloat(item.gram) === parseFloat(formData.gram)
    );

    if (existingItemIndex !== -1) {
      await updateExistingItem(existingItemIndex);
    } else {
      await createNewItem();
    }
  };

  const updateExistingItem = async (index) => {
    try {
      const updatedItem = {
        ...stockItems[index],
        quantity: (
          parseInt(stockItems[index].quantity) + parseInt(formData.quantity)
        ).toString(),
        totalWeight: formatToFixed3Strict(
          parseFloat(stockItems[index].totalWeight) +
          parseFloat(formData.totalWeight)
        ),
        purity: formatToFixed3Strict(
          parseFloat(stockItems[index].purity) + parseFloat(formData.purity)
        ),
      };

      const response = await fetch(
        `${BACKEND_SERVER_URL}/api/v1/stocks/${stockItems[index].id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedItem),
        }
      );

      if (!response.ok) throw new Error("Failed to update stock item");

      const result = await response.json();
      const updatedItems = [...stockItems];
      updatedItems[index] = result.data;
      setStockItems(updatedItems);
      toast.success("Existing stock item updated successfully!");
      resetForm();
    } catch (err) {
      console.error("Error updating stock:", err);
      toast.error("Failed to update stock item!");
    }
  };

  const createNewItem = async () => {
    try {
      const response = await fetch(
        `${BACKEND_SERVER_URL}/api/v1/stocks/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error("Failed to create stock item");

      const result = await response.json();
      setStockItems([result.data, ...stockItems]);
      toast.success("New stock item created successfully!");
      resetForm();
    } catch (err) {
      console.error("Error adding stock:", err);
      toast.error("Failed to create stock item!");
    }
  };

  const resetForm = () => {
    setFormData({
      coinType: "",
      gram: "",
      quantity: "",
      touch: "",
      totalWeight: "",
      purity: "",
    });
    setEditIndex(null);
    setEditingId(null);
    setShowPopup(false);
  };

  const handleEdit = (id) => {
    const index = stockItems.findIndex((item) => item.id === id);
    if (index === -1) return;

    setFormData({
      ...stockItems[index],
      gram: stockItems[index].gram.toString(),
      quantity: stockItems[index].quantity.toString(),
      touch: stockItems[index].touch.toString(),
    });
    setEditIndex(index);
    setEditingId(stockItems[index].id);
    setShowPopup(true);
  };

  const handleDelete = async (id) => {
    const index = stockItems.findIndex((item) => item.id === id);
    if (index === -1) return;

    const itemToDelete = stockItems[index];

    try {
      const response = await fetch(
        `${BACKEND_SERVER_URL}/api/v1/stocks/${itemToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete stock item");

      const updatedItems = stockItems.filter((_, i) => i !== index);
      setStockItems(updatedItems);
      toast.success("Stock item deleted successfully!");
    } catch (err) {
      console.error("Error deleting stock:", err);
      toast.error("Failed to delete stock item!");
    }
  };

  const filteredStockItems = useMemo(() => {
    return stockItems.filter((item) => {
      return (
        (filterCoinType === "" ||
          item.coinType
            ?.toLowerCase()
            .includes(filterCoinType.toLowerCase())) &&
        (filterGram === "" || item.gram?.toString().includes(filterGram))
      );
    });
  }, [stockItems, filterCoinType, filterGram]);

  const totals = useMemo(() => {
    let totalWeightSum = 0;
    let totalPuritySum = 0;

    filteredStockItems.forEach((item) => {
      totalWeightSum += parseFloat(item.totalWeight) || 0;
      totalPuritySum += parseFloat(item.purity) || 0;
    });

    return {
      totalWeight: formatToFixed3Strict(totalWeightSum),
      purity: formatToFixed3Strict(totalPuritySum),
    };
  }, [filteredStockItems]);

  const handleKeyDown = (e, nextRef) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
      } else {
        if (saveBtnRef && saveBtnRef.current) {
          saveBtnRef.current.focus();
        }
      }
    }
  };

  return (
    <div
      className="stock-container"
      style={{ maxWidth: "1200px", margin: "auto", padding: "2rem" }}
    >
      <ToastContainer position="top-right" autoClose={3000} />
      <h2
        style={{
          color: "#111827",
        }}
      >
        Coin Stock Report
      </h2>
      <button
        className="add-btn"
        onClick={() => {
          setShowPopup(true);
          setTimeout(() => {
            if (coinTypeRef.current) coinTypeRef.current.focus();
          }, 100);
        }}
        style={{
          backgroundColor: "#111827",
          color: "#ffffff",
          padding: "0.75rem 1.5rem",
          fontWeight: 600,
          borderRadius: "0.75rem",
          border: "none",
          cursor: "pointer",
          transition: "background-color 0.3s ease",
          marginBottom: "1rem",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#374151")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "#111827")
        }
      >
        Add Item
      </button>

      <div
        className="filter-section"
        style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}
      >
        <input
          type="text"
          placeholder="Filter by Coin Type"
          value={filterCoinType}
          onChange={(e) => setFilterCoinType(e.target.value)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.75rem",
            border: "1px solid #d1d5db",
            fontSize: "1rem",
            flex: 1,
          }}
          aria-label="Filter by Coin Type"
        />

        <input
          type="text"
          placeholder="Filter by Gram"
          value={filterGram}
          onChange={(e) => setFilterGram(e.target.value)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.75rem",
            border: "1px solid #d1d5db",
            fontSize: "1rem",
            flex: 1,
          }}
          aria-label="Filter by Gram"
        />
      </div>

      {showPopup && (
        <div
          className="popup-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.2)",
            backdropFilter: "blur(5px) saturate(180%)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="popupTitle"
        >
          <div
            className="popup"
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "0.75rem",
              padding: "2rem",
              width: "100%",
              maxWidth: "480px",
              boxShadow:
                "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <h3
              id="popupTitle"
              style={{
                fontWeight: 700,
                fontSize: "1.75rem",
                color: "#111827",
                marginBottom: "0.5rem",
              }}
            >
              {editIndex !== null ? "Edit Coin Stock" : "Add Coin Stock"}
            </h3>

            <div className="form-groups">
              <label htmlFor="coinType">Coin Type</label>
              <input
                id="coinType"
                type="text"
                name="coinType"
                placeholder="Coin Type Eg:916,999"
                value={formData.coinType}
                onChange={(e) => {
                  if (/^[0-9,]*$/.test(e.target.value)) {
                    handleChange(e);
                  }
                }}
                onKeyDown={(e) => handleKeyDown(e, gramRef)}
                required
                ref={coinTypeRef}
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #d1d5db",
                  fontSize: "1rem",
                  outline: "none",
                }}
                aria-label="Coin Type"
              />
            </div>

            <div className="form-groups">
              <label htmlFor="gram">Gram</label>
              <NumericFormat
                id="gram"
                name="gram"
                placeholder="Gram"
                value={formData.gram}
                onValueChange={(values) => {
                  handleChange({
                    target: {
                      name: "gram",
                      value: values.floatValue,
                    },
                  });
                }}
                onKeyDown={(e) => handleKeyDown(e, quantityRef)}
                getInputRef={gramRef}
                thousandSeparator=","
                decimalScale={3}
                allowNegative={false}
                required
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #d1d5db",
                  fontSize: "1rem",
                  outline: "none",
                }}
                aria-label="Gram"
              />
            </div>

            <div className="form-groups">
              <label htmlFor="quantity">Quantity</label>
              <NumericFormat
                id="quantity"
                name="quantity"
                placeholder="Quantity"
                value={formData.quantity}
                onValueChange={(values) => {
                  handleChange({
                    target: {
                      name: "quantity",
                      value: values.floatValue,
                    },
                  });
                }}
                onKeyDown={(e) => handleKeyDown(e, touchRef)}
                getInputRef={quantityRef}
                thousandSeparator=","
                decimalScale={0} // No decimals allowed
                allowNegative={false}
                min="1"
                required
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #d1d5db",
                  fontSize: "1rem",
                  outline: "none",
                }}
                aria-label="Quantity"
              />
            </div>

            <div className="form-groups">
              <label htmlFor="touch">Touch</label>
              <NumericFormat
                id="touch"
                name="touch"
                placeholder="Touch"
                value={formData.touch}
                onValueChange={(values) => {
                  handleChange({
                    target: {
                      name: "touch",
                      value: values.floatValue,
                    },
                  });
                }}
                onKeyDown={(e) => handleKeyDown(e, saveBtnRef)}
                getInputRef={touchRef}
                thousandSeparator=","
                decimalScale={2}
                allowNegative={false}
                isAllowed={(values) => {
                  const { floatValue } = values;
                  return (
                    floatValue === undefined ||
                    (floatValue >= 0 && floatValue <= 999.9)
                  );
                }}
                required
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #d1d5db",
                  fontSize: "1rem",
                  outline: "none",
                }}
                aria-label="Touch"
              />
            </div>

            <div className="form-groups">
              <label htmlFor="totalWeight">Total Weight</label>
              <NumericFormat
                id="totalWeight"
                name="totalWeight"
                placeholder="Total Weight"
                value={formData.totalWeight}
                onValueChange={(values) => {
                  handleChange({
                    target: {
                      name: "totalWeight",
                      value: values.floatValue,
                    },
                  });
                }}
                thousandSeparator=","
                decimalScale={3}
                allowNegative={false}
                disabled
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#f9fafb",
                  fontSize: "1rem",
                  color: "#6b7280",
                  cursor: "not-allowed",
                }}
                aria-label="Total Weight"
              />
            </div>

            <div className="form-groups">
              <label htmlFor="purity">Purity</label>
              <NumericFormat
                id="purity"
                name="purity"
                placeholder="Purity"
                value={formData.purity}
                thousandSeparator=","
                decimalScale={3}
                fixedDecimalScale={true} 
                allowNegative={false}
                disabled
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#f9fafb",
                  fontSize: "1rem",
                  color: "#6b7280",
                  cursor: "not-allowed",
                }}
                aria-label="Purity"
              />
            </div>

            <div
              className="popup-buttons"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "1rem",
              }}
            >
              <button
                className="save-btn"
                onClick={handleSubmit}
                ref={saveBtnRef}
                style={{
                  backgroundColor: "#111827",
                  color: "#fff",
                  padding: "0.75rem 1.5rem",
                  fontWeight: 600,
                  borderRadius: "0.75rem",
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 0.3s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#374151")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#111827")
                }
              >
                {editIndex !== null ? "Update" : "Save"}
              </button>
              <button
                className="close-btn"
                onClick={resetForm}
                style={{
                  backgroundColor: "#e5e7eb",
                  color: "#374151",
                  padding: "0.75rem 1.5rem",
                  fontWeight: 600,
                  borderRadius: "0.75rem",
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 0.3s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#d1d5db")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#e5e7eb")
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="table-container"
        style={{
          overflowX: "auto",
          boxShadow:
            "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
          borderRadius: "0.75rem",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "#ffffff",
            borderRadius: "0.75rem",
            minWidth: "600px",
          }}
          aria-label="Coin Stock Table"
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "1rem",
                  borderBottom: "2px solid #e5e7eb",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Date
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "1rem",
                  borderBottom: "2px solid #e5e7eb",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Coin Type
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "1rem",
                  borderBottom: "2px solid #e5e7eb",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Gram
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "1rem",
                  borderBottom: "2px solid #e5e7eb",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Quantity
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "1rem",
                  borderBottom: "2px solid #e5e7eb",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                %
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "1rem",
                  borderBottom: "2px solid #e5e7eb",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Total Weight
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "1rem",
                  borderBottom: "2px solid #e5e7eb",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Purity
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "1rem",
                  borderBottom: "2px solid #e5e7eb",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredStockItems
              .slice()
              .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
              .map((item, index) => (
                <tr
                  key={item.id || index}
                  style={{
                    borderBottom: "1px solid #f3f4f6",
                    transition: "background-color 0.2s ease",
                  }}
                  tabIndex={0}
                  aria-label={`Stock item ${item.coinType}, Gram ${item.gram}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEdit(index);
                  }}
                >
                  <td style={{ padding: "0.75rem 1rem", color: "#374151" }}>
                    {((dateStr) => {
                      const d = new Date(dateStr);
                      return `${String(d.getUTCDate()).padStart(
                        2,
                        "0"
                      )}-${String(d.getUTCMonth() + 1).padStart(
                        2,
                        "0"
                      )}-${d.getUTCFullYear()}`;
                    })(item.updatedAt)}
                  </td>

                  <td style={{ padding: "0.75rem 1rem", color: "#374151" }}>
                    {item.coinType}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#374151" }}>
                    {formatToFixed3Strict(item.gram)}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#374151" }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#374151" }}>
                    {formatNumber(item.touch, 2)}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#374151" }}>
                    {formatToFixed3Strict(item.totalWeight)}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#374151" }}>
                    {formatToFixed3Strict(item.purity)}
                  </td>
                  <td
                    style={{
                      padding: "0.75rem 1rem",
                      display: "flex",
                      gap: "0.5rem",
                    }}
                  >
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(item.id)}
                      style={{
                        backgroundColor: "#2563eb",
                        color: "#fff",
                        borderRadius: "0.5rem",
                        border: "none",
                        padding: "0.375rem 0.75rem",
                        cursor: "pointer",
                        transition: "background-color 0.3s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#1d4ed8")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "#2563eb")
                      }
                      aria-label={`Edit stock item ${item.coinType}`}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(item.id)}
                      style={{
                        backgroundColor: "#ef4444",
                        color: "#fff",
                        borderRadius: "0.5rem",
                        border: "none",
                        padding: "0.375rem 0.75rem",
                        cursor: "pointer",
                        transition: "background-color 0.3s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#b91c1c")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "#ef4444")
                      }
                      aria-label={`Delete stock item ${item.coinType}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr
              style={{
                backgroundColor: "#f9fafb",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              <td colSpan="5" style={{ textAlign: "right", padding: "1rem" }}>
                Totals:
              </td>
              <td style={{ padding: "1rem" }}>
                {formatToFixed3Strict(totals.totalWeight)}
              </td>
              <td style={{ padding: "1rem" }}>
                {formatToFixed3Strict(totals.purity)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default Stock;
