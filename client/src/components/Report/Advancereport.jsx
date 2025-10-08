import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Advance.css";
import { BACKEND_SERVER_URL } from "../../Config/Config";
import { formatNumber } from "../../utils/formatNumber";
import { formatToFixed3Strict } from "../../utils/formatToFixed3Strict";

const Advancereport = () => {
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [totalPurity, setTotalPurity] = useState(0);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axios.get(`${BACKEND_SERVER_URL}/api/customers`);
        setCustomers(res.data);
      } catch (error) {
        console.error("Failed to fetch customers", error);
      }
    };

    const fetchTransactions = async () => {
      try {
        const res = await axios.get(
          `${BACKEND_SERVER_URL}/api/transactions/all`
        );
        setTransactions(res.data);

        // Calculate total purity
        const puritySum = res.data.reduce((sum, txn) => {
          if (txn.purity) {
            return sum + parseFloat(txn.purity);
          } else if (txn.type === "Cash" && txn.value && txn.goldRate) {
            const calculatedPurity = txn.value / txn.goldRate;
            return sum + calculatedPurity;
          }
          return sum;
        }, 0);
        setTotalPurity(puritySum);
      } catch (error) {
        console.error("Failed to fetch transactions", error);
      }
    };

    fetchCustomers();
    fetchTransactions();
  }, []);

  return (
    <div className="advance-report-container">
      <h2>Advance Payments Report</h2>
      <br></br>

      {transactions.length > 0 ? (
        <table className="advance-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Value</th>
              <th>Purity (grams)</th>
              <th>Touch</th>
              <th>Gold Rate</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn.id}>
                <td>{new Date(txn.date).toLocaleDateString("en-IN")}</td>
                <td>{txn.customer?.name || "-"}</td>
                <td>{txn.type}</td>
                <td>
                  {txn.type === "Cash"
                    ? `₹${formatNumber(txn.value, 2)}`
                    : `${formatToFixed3Strict(txn.value)}g`}
                </td>
                <td>{formatToFixed3Strict(txn.purity) || "-"}</td>
                <td>
                  {txn.type === "Cash"
                    ? txn.touch
                      ? `${formatNumber(txn.touch, 3)}%`
                      : "-"
                    : txn.touch
                    ? `${formatNumber(txn.touch, 3)}%`
                    : "%"}
                </td>
                <td>
                  {txn.goldRate && txn.type === "Cash"
                    ? `₹${formatNumber(txn.goldRate, 2)}`
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr
              style={{
                backgroundColor: "#424242",
                color: "#fff",
                "& .MuiTableCell-root": {
                  color: "#fff",
                  fontWeight: "bold",
                },
                "&:hover": {
                  backgroundColor: "#424242",
                },
              }}
            >
              <td colSpan="4">Total Purity:</td>
              <td>{formatToFixed3Strict(totalPurity)}g</td>
              <td colSpan="2  "></td>
            </tr>
          </tfoot>
        </table>
      ) : (
        <p className="no-data">No advance payments found.</p>
      )}
    </div>
  );
};

export default Advancereport;
