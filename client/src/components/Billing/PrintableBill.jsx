import React from "react";
import { formatNumber } from "../../utils/formatNumber";
import { formatToFixed3Strict } from "../../utils/formatToFixed3Strict";

const PrintableBill = React.forwardRef((props, ref) => {
  const {
    billNo,
    date,
    time,
    selectedCustomer,
    billItems,
    totalWeight,
    totalPurity,
    totalAmount,
    hallmarkCharges,
    rows,
    pureBalance,
    hallmarkBalance,
    goldRate,
    viewMode,
    selectedBill,
  } = props;

  const styles = {
    printableBill: {
      width: "100%",
      fontFamily: "Arial, sans-serif",
    },
    container: {
      margin: "0",
      padding: "10px",
    },
    heading: {
      textAlign: "center",
      margin: "0",
    },
    subheading: {
      margin: "0",
      marginBottom: "10px",
    },
    billInfo: {
      display: "flex",
      justifyContent: "space-between",
    },
    billInfoItem: { margin: "0", marginBottom: "5px" },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      marginBottom: "10px",
      fontSize: "14px",
    },
    th: {
      border: "1px solid #ddd",
      padding: "4px",
      textAlign: "left",
      backgroundColor: "#f2f2f2",
    },
    td: {
      border: "1px solid #ddd",
      padding: "4px",
      textAlign: "left",
    },
    billSummary: {
      backgroundColor: "#f9f9f9",
      borderRadius: "4px",
    },
    balanceDetails: {
      backgroundColor: "#f9f9f9",
      borderRadius: "4px",
    },
    summaryRow: {
      display: "flex",
      justifyContent: "space-between",
    },
    totalRow: {
      fontWeight: "bold",
      borderTop: "1px solid #ddd",
    },
    flex: {
      display: "flex",
      justifyContent: "space-between",
      flexWrap: "wrap",
    },
    flexFirstChild: {
      flex: 1,
      textAlign: "left",
      margin: "0",
    },
    flexSecondChild: {
      flex: 1,
      textAlign: "right",
      margin: "0",
    },
    flexLastChild: {
      flex: "0 0 100%",
      textAlign: "center",
      margin: "0",
    },
  };

  console.log("Rendering PrintableBill with props:", props);

  const calculateBalancess = () => {
    let pure = parseFloat(pureBalance);
    let total = parseFloat(totalAmount);
    let hallmark = parseFloat(hallmarkCharges);

    rows.forEach((row) => {
      if (row.mode === "weight" && row.purityWeight) {
        pure -= parseFloat(row.purityWeight);
      } else if (row.mode === "amount" && parseFloat(row.amount) > 0) {
        const amount = parseFloat(row.amount);
        const hallmarkDeduction = Math.min(amount, hallmark);

        hallmark -= hallmarkDeduction;
        const amountAfterHallmark = amount - hallmarkDeduction;

        if (amountAfterHallmark > 0 && row.goldRate) {
          const purity = amountAfterHallmark / parseFloat(row.goldRate);

          pure -= purity;
        }
      } else if (row.mode === "amount" && parseFloat(row.paidAmount) > 0) {
        const amount = parseFloat(row.paidAmount);
        const hallmarkDeduction = Math.min(amount, hallmark);

        hallmark -= hallmarkDeduction;
        const amountAfterHallmark = amount - hallmarkDeduction;

        if (amountAfterHallmark > 0 && row.goldRate) {
          const purity = amountAfterHallmark / parseFloat(row.goldRate);
          pure += purity;
        }
      }
    });

    return {
      pureBalance: pure,
      totalBalance: total,
      hallmarkBalance: Math.max(0, hallmark),
    };
  };

  const currentBalances = calculateBalancess();

  const lastRowWithAmount = [...rows]
    .reverse()
    .find((row) => parseFloat(row.goldRate) > 0);

  const totalBalance = lastRowWithAmount
    ? currentBalances.pureBalance * parseFloat(lastRowWithAmount.goldRate)
    : 0;

  return (
    <div style={styles.printableBill} ref={ref}>
      <div style={styles.container}>
        <h2 style={styles.heading}>Estimate Only</h2>

        <div style={styles.billInfo}>
          <div>
            <p style={styles.billInfoItem}>
              <strong>Bill No:</strong> {viewMode ? selectedBill?.id : billNo}
            </p>
            <p style={styles.billInfoItem}>
              <strong>Customer Name:</strong> {selectedCustomer?.name}
            </p>
          </div>
          <div>
            <p style={styles.billInfoItem}>
              <strong>Date:</strong> {date}
            </p>
            <p style={styles.billInfoItem}>
              <strong>Time:</strong> {time}
            </p>
          </div>
        </div>

        <div>
          <h4 style={styles.subheading}>Bill Details:</h4>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Coin Name</th>
                <th style={styles.th}>No.</th>
                <th style={styles.th}>%</th>
                <th style={styles.th}>Weight (g)</th>
                <th style={styles.th}>Purity (g)</th>
                <th style={styles.th}>Gold Rate (₹)</th>
                <th style={styles.th}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {billItems.map((item, index) => (
                <tr key={index}>
                  <td style={styles.td}>
                    {item.coinValue}g {item.percentage}
                  </td>
                  <td style={styles.td}>{item.quantity}</td>
                  <td style={styles.td}>{item.touch}</td>

                  <td style={styles.td}>{formatToFixed3Strict(item.weight)}</td>
                  <td style={styles.td}>{formatToFixed3Strict(item.purity)}</td>
                  <td style={styles.td}>{formatNumber(item.goldRate, 2)}</td>
                  <td style={styles.td}>{formatNumber(item.amount, 2)}</td>
                </tr>
              ))}

              <tr>
                <td style={styles.td}>
                  <strong>Total</strong>
                </td>
                <td style={styles.td}>
                  <strong>
                    {billItems.reduce(
                      (sum, item) => sum + parseInt(item.quantity),
                      0
                    )}
                  </strong>
                </td>
                <td style={styles.td}></td>
                <td style={styles.td}>
                  <strong>{formatToFixed3Strict(totalWeight)}</strong>
                </td>
                <td style={styles.td}>
                  <strong>{formatToFixed3Strict(totalPurity)}</strong>
                </td>
                <td style={styles.td}></td>
                <td style={styles.td}>
                  <strong>{formatNumber(totalAmount, 2)}</strong>
                </td>
              </tr>

              <tr>
                <td style={styles.td} colSpan={5}>
                  <strong>Hallmark or MC Charges</strong>
                </td>
                <td style={styles.td}></td>
                <td style={styles.td}>{formatNumber(hallmarkCharges, 2)}</td>
              </tr>
              <tr>
                <td style={styles.td} colSpan={5}>
                  <strong>Total Amount</strong>
                </td>
                <td style={styles.td}></td>
                <td style={styles.td}>
                  <strong>
                    {selectedBill
                      ? formatNumber(
                          parseFloat(totalAmount) +
                            parseFloat(selectedBill?.hallmarkCharges || 0),
                          2
                        )
                      : formatNumber(
                          parseFloat(totalAmount) +
                            parseFloat(hallmarkCharges || 0),
                          2
                        )}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {rows.length > 0 && (
          <div>
            <h4 style={styles.subheading}>Received Details</h4>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>S.No</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Gold WT (g)</th>
                  <th style={styles.th}>Gold Rate (₹)</th>
                  <th style={styles.th}>%</th>
                  <th style={styles.th}>Purity (g)</th>
                  <th style={styles.th}>Received Amount (₹)</th>
                  <th style={styles.th}>Paid Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>
                      {row.date
                        ? new Date(row.date)
                            .toLocaleDateString("en-GB")
                            .replace(/\//g, "-")
                        : ""}
                    </td>

                    <td style={styles.td}>
                      {formatToFixed3Strict(row.givenGold)}
                    </td>
                    <td style={styles.td}>{formatNumber(row.goldRate, 2)}</td>
                    <td style={styles.td}>{formatNumber(row.touch, 2)}</td>
                    <td style={styles.td}>
                      {formatToFixed3Strict(row.purityWeight)}
                    </td>
                    <td style={styles.td}>{formatNumber(row.amount, 2)}</td>
                    <td style={styles.td}>{formatNumber(row.paidAmount, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={styles.flex}>
          <p style={styles.flexFirstChild}>
            <b>
              Pure Balance: {formatToFixed3Strict(currentBalances.pureBalance)}g
            </b>
          </p>
          <p style={styles.flexSecondChild}>
            <b>
              Hallmark Balance: ₹{" "}
              {formatNumber(currentBalances.hallmarkBalance, 2)}
            </b>
          </p>
          <p style={styles.flexLastChild}>
            <b>
              Total Balance: ₹{" "}
              {totalBalance > 0
                ? (() => {
                    console.log("✅ IF block executed");
                    return formatNumber(
                      totalBalance + currentBalances.hallmarkBalance,
                      2
                    );
                  })()
                : (() => {totalBalance
                    console.log("❌ ELSE block executed");
                    return formatNumber(totalBalance, 2);
                  })()}
            </b>
          </p>
        </div>
      </div>
    </div>
  );
});

export default PrintableBill;
