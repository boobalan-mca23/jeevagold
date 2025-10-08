import React, { useState, useEffect } from "react";
import {
  TextField,
  Box,
  Modal,
  Typography,
  Button,
  Alert,
  IconButton,
} from "@mui/material";
import { MdDeleteForever } from "react-icons/md";
import { NumericFormat } from "react-number-format";
import { formatNumber } from "../../utils/formatNumber";
import { formatToFixed3Strict } from "../../utils/formatToFixed3Strict";

const BillDetails = ({
  billItems,
  setBillItems,
  totalWeight,
  totalPurity,
  totalAmount,
  displayHallmarkCharges,
  handleHallmarkChange,
  viewMode,
  selectedBill,
  openAddItem,
  setOpenAddItem,
  stockData,
  showSnackbar,
}) => {
  const [newItem, setNewItem] = useState({
    name: "",
    no: "",
    percentage: "",
    weight: "",
    pure: "",
    touch: "",
  });
  const [availableStock, setAvailableStock] = useState(0);
  const [stockError, setStockError] = useState(null);

  useEffect(() => {
    if (newItem.percentage) {
      checkStockAvailability();
    }
  }, [newItem.percentage, newItem.name, newItem.no]);

  const checkStockAvailability = () => {
    if (!newItem.percentage) return;

    const selectedCoin = stockData.find(
      (item) =>
        item.gram === parseFloat(newItem.name || 0) &&
        item.coinType === newItem.percentage
    );

    if (selectedCoin) {
      setAvailableStock(selectedCoin.quantity);
      if (newItem.no && selectedCoin.quantity < parseInt(newItem.no)) {
        setStockError(`Insufficient stock Available: ${selectedCoin.quantity}`);
      } else {
        setStockError(null);
      }
    } else {
      setAvailableStock(0);
      if (newItem.name) {
        setStockError("No stock available for this combination");
      }
    }
  };

  const handleCloseAddItem = () => {
    setOpenAddItem(false);
    setNewItem({
      name: "",
      no: "",
      percentage: "",
      weight: "",
      pure: "",
      touch: "",
    });
    setStockError(null);
  };

  const isValidNumericInput = (value) => {
    return /^(\d+\.?\d{0,3}|\.\d{1,3})?$/.test(value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (
      ["no", "touch", "weight", "pure"].includes(name) &&
      !isValidNumericInput(value)
    ) {
      return;
    }

    if (parseFloat(value) < 0) return;

    setNewItem((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      if (name === "weight") {
        const touch = parseFloat(updated.touch) || 0;
        const weight = parseFloat(value) || 0;
        if (touch && weight) {
          updated.pure = parseFloat((weight * (touch / 100)).toFixed(3));
        }
      } else if (["name", "no", "touch"].includes(name)) {
        const coin = parseFloat(updated.name) || 0;
        const no = parseFloat(updated.no) || 0;
        const touch = parseFloat(updated.touch) || 0;

        if (coin && no && touch) {
          const weight = coin * no;
          const pure = weight * (touch / 100);
          updated.weight = weight;
          updated.pure = pure.toFixed(3);
        }
      } else if (name === "pure") {
        const floatVal = parseFloat(value);
        if (!isNaN(floatVal)) {
          updated.pure = parseFloat(floatVal.toFixed(3));
        } else {
          updated.pure = value;
        }
      }

      return updated;
    });
  };

  const handleSaveItem = () => {
    if (!newItem.name || !newItem.no || !newItem.percentage) {
      showSnackbar("Please fill all required fields", "error");
      return;
    }

    if (stockError) {
      showSnackbar(stockError, "error");
      return;
    }

    setBillItems((prevItems) => [
      ...prevItems,
      {
        id: Date.now().toString(),
        coinValue: parseFloat(newItem.name),
        quantity: parseInt(newItem.no),
        percentage: newItem.percentage,
        touch: newItem.touch,
        weight: newItem.weight,
        purity: newItem.pure,
        goldRate: "",
        amount: "",
        displayName: `${newItem.name}g ${newItem.percentage}`,
      },
    ]);

    handleCloseAddItem();
  };

  const handleDeleteItem = (index) => {
    const updatedBillItems = [...billItems];
    updatedBillItems.splice(index, 1);
    setBillItems(updatedBillItems);
  };

  const handleBillItemChange = (index, field, value) => {
    const updatedBillItems = [...billItems];
    updatedBillItems[index][field] = value;

    if (field === "goldRate") {
      const goldRateVal = parseFloat(value);
      const purityVal = parseFloat(updatedBillItems[index].purity);

      if (!isNaN(goldRateVal)) {
        updatedBillItems[index].amount =
          goldRateVal && purityVal ? goldRateVal * purityVal : "";
      }
    }

    setBillItems(updatedBillItems);
  };

  return (
    <Box className="itemsSection">
      <div className="bill">
        <h3>Bill Details:</h3>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th className="th">Coin Name</th>
            <th className="th">No</th>
            <th className="th">%</th>
            <th className="th">Weight</th>
            <th className="th">Purity</th>
            <th className="th">Amount</th>
            <th className="th">Gold Rate</th>
            <div className="no-print-bill">
              <th className="th">Action</th>
            </div>
          </tr>
        </thead>
        <tbody>
          {billItems.map((item, index) => (
            <tr key={index}>
              <td className="td">
                {item.coinValue}g {item.percentage}
              </td>
              <td className="td">{item.quantity}</td>
              <td className="td">{formatNumber(item.touch, 2)}</td>
              <td className="td">{formatToFixed3Strict(item.weight)}</td>
              <td className="td"> {formatToFixed3Strict(item.purity)}</td>
              <td className="td">
                {item.goldRate ? formatNumber(item.amount, 2) : ""}
              </td>

              <td className="td">
                <NumericFormat
                  customInput={TextField}
                  size="small"
                  value={item.goldRate || ""}
                  onValueChange={(values) => {
                    handleBillItemChange(index, "goldRate", values.floatValue);
                  }}
                  thousandSeparator=","
                  decimalScale={2}
                  disabled={viewMode && selectedBill}
                  inputProps={{ min: 0 }}
                />
              </td>
              <div className="no-prints-bill">
                <td className="td">
                  {!viewMode && (
                    <IconButton
                      onClick={() => handleDeleteItem(index)}
                      disabled={viewMode && selectedBill}
                    >
                      <MdDeleteForever />
                    </IconButton>
                  )}
                </td>
              </div>
            </tr>
          ))}

          <tr>
            <td className="td">
              <strong  className="billRow">Total</strong>
            </td>
            <td className="td">
              <strong  className="billRow">
                {billItems.reduce(
                  (sum, item) => sum + parseInt(item.quantity),
                  0
                )}
              </strong>
            </td>
            <td className="td "></td>
            <td className="td">
              <strong className="billRow">{formatToFixed3Strict(totalWeight)}</strong>
            </td>
            <td className="td ">
              <strong className="billRow">{formatToFixed3Strict(totalPurity)}</strong>
            </td>
            <td className="td">
              <strong className="billRow">{formatNumber(totalAmount, 2)}</strong>
            </td>
            <td className="td"></td>
            <div className="no-prints-bill">
              <td className="td"></td>
            </div>
          </tr>

          <tr>
            <td className="td" colSpan={5}>
              <strong>Hallmark or MC Charges</strong>
            </td>
            <td className="td">
              <NumericFormat
                customInput={TextField}
                size="small"
                value={displayHallmarkCharges > 0 ? displayHallmarkCharges : ""}
                onChange={handleHallmarkChange}
                thousandSeparator=","
                decimalScale={2}
                disabled={viewMode && selectedBill}
                inputProps={{ min: 0 }}
              />
            </td>
            <td className="td"></td>
            <div className="no-prints-bill">
              <td className="td"></td>
            </div>
          </tr>
          <tr>
            <td className="td" colSpan={5}>
              <strong>Total Amount</strong>
            </td>
            <td className="td">
              <strong>
                {selectedBill
                  ? formatNumber(
                      parseFloat(totalAmount) +
                        parseFloat(selectedBill?.hallmarkCharges || 0),
                      2
                    )
                  : formatNumber(
                      parseFloat(totalAmount) +
                        parseFloat(displayHallmarkCharges || 0),
                      2
                    )}
              </strong>
            </td>

            <td className="td"></td>
            <div className="no-prints-bill">
              <td className="td"></td>
            </div>
          </tr>
        </tbody>
      </table>

      <Modal
        open={openAddItem}
        onClose={handleCloseAddItem}
        aria-labelledby="add-item-modal"
      >
        <Box className="modal-container">
          <Typography variant="h6" gutterBottom>
            Add Bill Details
          </Typography>
          <Box component="form" className="modal-form">
            <TextField
              fullWidth
              label="Coin Info (e.g. 8g 916)"
              name="coinInfo"
              value={newItem.coinInfo || ""}
              onChange={(e) => {
                const input = e.target.value;
                setNewItem((prev) => ({ ...prev, coinInfo: input }));

                const match = input.match(/(\d+(?:\.\d+)?)g\s*(916|999)/);
                if (match) {
                  const gram = parseFloat(match[1]);
                  const purity = match[2];

                  let autoPercentage = "";
                  let autoTouch = "";
                  if (purity === "916") {
                    autoPercentage = "916";
                    autoTouch = "92";
                  } else if (purity === "999") {
                    autoPercentage = "999";
                    autoTouch = "99.9";
                  }

                  setNewItem((prev) => ({
                    ...prev,
                    name: gram.toString(),
                    percentage: autoPercentage,
                    touch: autoTouch,
                    weight: "",
                    pure: "",
                  }));

                  const matchingStock = stockData.find(
                    (item) => item.coinType === purity && item.gram === gram
                  );

                  if (!matchingStock) {
                    setStockError(`No available stock for ${gram}g ${purity}`);
                    setAvailableStock(0);
                  } else {
                    setAvailableStock(matchingStock.quantity);
                    setStockError(null);
                  }
                } else {
                  setStockError("Invalid format. Use like '8g 916'");
                  setNewItem((prev) => ({
                    ...prev,
                    name: "",
                    percentage: "",
                    touch: "",
                  }));
                  setAvailableStock(0);
                }
              }}
              margin="normal"
              required
              disabled={viewMode && selectedBill}
            />

            {newItem.percentage && (
              <Box>
                {newItem.name ? (
                  <>
                    <Typography variant="body2">
                      Available Stock: {availableStock}
                    </Typography>
                    {stockError && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        {stockError}
                      </Alert>
                    )}
                  </>
                ) : (
                  <Typography variant="body2">
                    Available coins for {newItem.percentage}:{" "}
                    {stockData
                      .filter((item) => item.coinType === newItem.percentage)
                      .map((item) => item.gram)
                      .join(", ")}
                  </Typography>
                )}
              </Box>
            )}

            <NumericFormat
              fullWidth
              label="No of Coins"
              name="no"
              value={newItem.no}
              onValueChange={(values) => {
                handleInputChange({
                  target: {
                    name: "no",
                    value: values.floatValue,
                  },
                });
              }}
              margin="normal"
              required
              disabled={viewMode && selectedBill}
              decimalScale={0}
              allowNegative={false}
              customInput={TextField}
              inputProps={{ min: 0 }}
            />

            <NumericFormat
              fullWidth
              label="Percentage"
              name="touch"
              value={newItem.touch || ""}
              onValueChange={(values) => {
                handleInputChange({
                  target: {
                    name: "touch",
                    value: values.floatValue,
                  },
                });
              }}
              margin="normal"
              required
              disabled={viewMode && selectedBill}
              decimalScale={2}
              allowNegative={false}
              customInput={TextField}
              inputProps={{ min: 0 }}
            />

            <NumericFormat
              fullWidth
              label="Weight (Auto-calculated)"
              name="weight"
              value={newItem.weight}
              onValueChange={(values) => {
                handleInputChange({
                  target: {
                    name: "weight",
                    value: values.floatValue,
                  },
                });
              }}
              margin="normal"
              decimalScale={3}
              allowNegative={false}
              customInput={TextField}
              inputProps={{ min: 0 }}
            />

            <NumericFormat
              fullWidth
              label="Purity (Auto-calculated or Manual)"
              name="pure"
              value={newItem.pure}
              onValueChange={(values) => {
                setNewItem((prev) => ({
                  ...prev,
                  pure: values.floatValue,
                }));
              }}
              onBlur={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                  setNewItem((prev) => ({
                    ...prev,
                    pure: val.toFixed(3),
                  }));
                }
              }}
              margin="normal"
              decimalScale={3}
              allowNegative={false}
              customInput={TextField}
              inputProps={{ min: 0 }}
            />

            <Box className="modal-actions">
              <Button onClick={handleCloseAddItem} className="cancel-button">
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveItem}
                className="save-button"
                disabled={!!stockError || (viewMode && selectedBill)}
              >
                Save
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default BillDetails;
