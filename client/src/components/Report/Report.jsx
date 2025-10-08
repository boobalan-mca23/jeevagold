import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  TablePagination,
  TableFooter,
  Modal,
  IconButton,
} from "@mui/material";
import { BACKEND_SERVER_URL } from "../../Config/Config";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { formatNumber } from "../../utils/formatNumber";
import { formatToFixed3Strict } from "../../utils/formatToFixed3Strict";

const DailySalesReport = () => {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [date, setDate] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const response = await fetch(
          `${BACKEND_SERVER_URL}/api/bills?_embed=receivedDetails`
        );
        const data = await response.json();
        setBills(data);
        setFilteredBills(data);
      } catch (error) {
        console.error("Error fetching bills:", error);
      }
    };

    fetchBills();
  }, []);

  useEffect(() => {
    if (date) {
      const filtered = bills.filter(
        (bill) =>
          new Date(bill.createdAt).toDateString() ===
          new Date(date).toDateString()
      );
      setFilteredBills(filtered);
    } else {
      setFilteredBills(bills);
    }
    setPage(0);
  }, [date, bills]);

  const calculateMetrics = () => {
    return filteredBills.reduce(
      (acc, bill) => {
        const hallmarkCharge = bill.hallmarkCharges || 0;

        const itemPurityTotal = bill.items.reduce(
          (sum, item) => sum + item.purity,
          0
        );

        const received = bill.receivedDetails?.reduce(
          (sum, detail) => ({
            pure: sum.pure + (detail.purityWeight || 0),
            cash: sum.cash + (detail.amount || 0),
            hallmark: sum.hallmark + (detail.hallmark || 0),
          }),
          { pure: 0, cash: 0, hallmark: 0 }
        ) || { pure: 0, cash: 0, hallmark: 0 };

        const pureBalanceForMetric = itemPurityTotal - received.pure;
        const hallmarkBalanceForMetric = hallmarkCharge - received.hallmark;

        const grandTotalAmount = filteredBills.reduce((total, bill) => {
          const itemTotal = bill.items.reduce((sum, item) => {
            return sum + item.goldRate * item.purity;
          }, 0);

          return total + itemTotal + bill.hallmarkCharges;
        }, 0);

        return {
          totalSales: grandTotalAmount,
          totalWeight:
            acc.totalWeight +
            bill.items.reduce((sum, item) => sum + item.weight, 0),
          totalPurity:
            acc.totalPurity +
            bill.items.reduce((sum, item) => sum + item.purity, 0),
          pureReceived: acc.pureReceived + received.pure,
          cashReceived: acc.cashReceived + received.cash,
          hallmarkReceived: acc.hallmarkReceived,
          cashPaid: acc.cashPaid,
          outstandingHallmark:
            acc.outstandingHallmark + hallmarkBalanceForMetric,
          outstandingPure: acc.outstandingPure + pureBalanceForMetric,
        };
      },
      {
        totalSales: 0,
        totalWeight: 0,
        totalPurity: 0,
        pureReceived: 0,
        cashReceived: 0,
        hallmarkReceived: 0,
        cashPaid: 0,
        outstandingHallmark: 0,
        outstandingPure: 0,
      }
    );
  };

  const metrics = calculateMetrics();

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleReset = () => {
    setDate("");
    setFilteredBills(bills);
  };

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
    setViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setViewModalOpen(false);
    setSelectedBill(null);
  };

  const calculateTotalCashBalance = () => {
    let totalCashBalance = 0;

    filteredBills.forEach((bill) => {
      const hallmarkBalance = bill.hallmarkBalance || 0;
      const hallmarkCharge = bill.hallmarkCharges || 0;

      const goldRateRows =
        bill.receivedDetails?.filter(
          (row) => row.goldRate && parseFloat(row.goldRate) > 0
        ) || [];

      const latestGoldRate = parseFloat(
        goldRateRows[goldRateRows.length - 1]?.goldRate || 0
      );

      const received = bill.receivedDetails?.reduce(
        (sum, detail) => ({
          pure: sum.pure + (detail.purityWeight || 0),
        }),
        { pure: 0 }
      ) || { pure: 0 };

      const pureBalance = bill.totalPurity - received.pure;

      let cashBalance = 0;
      if (hallmarkBalance > 0) {
        cashBalance =
          latestGoldRate > 0
            ? pureBalance * latestGoldRate - hallmarkBalance
            : hallmarkCharge;
      } else {
        cashBalance =
          latestGoldRate > 0 ? pureBalance * latestGoldRate : hallmarkCharge;
      }

      totalCashBalance += cashBalance;
    });

    return totalCashBalance;
  };

  console.log("sssss", filteredBills)

  return (
    <Box sx={{ p: 3 }}>
      <Typography style={{ textAlign: "center" }} variant="h5" gutterBottom>
        Daily Sales Report
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          label="Select Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 200 }}
        />
        <Button variant="outlined" onClick={handleReset}>
          Show All
        </Button>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          mb: 3,
          alignItems: "center",
          bgcolor: "#f5f5f5",
          p: 2,
          borderRadius: 2,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Total Weight: {formatToFixed3Strict(metrics.totalWeight)} g
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Total Purity: {formatToFixed3Strict(metrics.totalPurity)} g
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Pure Received: {formatToFixed3Strict(metrics.pureReceived)} g
        </Typography>

        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Number of Bills: {filteredBills.length}
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Bill No</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Total Weight</TableCell>
              <TableCell>Total Purity</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Amount Received</TableCell>
              <TableCell>Pure Received</TableCell>
              <TableCell>Cash Balance</TableCell>
              <TableCell>Pure Balance</TableCell>
              <TableCell>View</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBills
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((bill) => {
                const totalWeight = bill.items.reduce(
                  (sum, item) => sum + item.weight,
                  0
                );
                const totalPurity = bill.items.reduce(
                  (sum, item) => sum + item.purity,
                  0
                );

                const hallmarkCharge = bill.hallmarkCharges || 0;

                const received = bill.receivedDetails?.reduce(
                  (sum, detail) => ({
                    cash: sum.cash + (detail.amount || 0),
                    pure: sum.pure + (detail.purityWeight || 0),
                    hallmark: sum.hallmark + (detail.hallmark || 0),
                  }),
                  { cash: 0, pure: 0, hallmark: 0 }
                ) || { cash: 0, pure: 0, hallmark: 0 };

                const goldRateRows = bill.receivedDetails?.filter(
                  (row) => row.goldRate && parseFloat(row.goldRate) > 0
                );

                const latestGoldRate = parseFloat(
                  goldRateRows[goldRateRows.length - 1]?.goldRate
                );

                const hallmarkBalance = bill.hallmarkBalance;

                const pureBalance = bill.totalPurity - received.pure;

                let cashBalance = 0;

                if (hallmarkBalance > 0) {
                  latestGoldRate
                    ? (cashBalance =
                        pureBalance * latestGoldRate - hallmarkBalance)
                    : hallmarkCharge;
                } else {
                  latestGoldRate
                    ? (cashBalance = pureBalance * latestGoldRate)
                    : hallmarkCharge;
                }

                const totalAmount =
                  bill.items.reduce((sum, item) => {
                    return sum + item.goldRate * item.purity;
                  }, 0) + bill.hallmarkCharges;

                return (
                  <TableRow key={bill.id}>
                    <TableCell>BILL-{bill.id}</TableCell>
                    <TableCell>{bill.customer?.name || "Unknown"}</TableCell>
                    <TableCell>{formatToFixed3Strict(totalWeight)}</TableCell>
                    <TableCell>{formatToFixed3Strict(totalPurity)}</TableCell>
                    <TableCell>₹{formatNumber(totalAmount, 2)}</TableCell>
                    <TableCell>
                      ₹{formatNumber(received.cash + received.hallmark, 2)}
                    </TableCell>
                    <TableCell>{formatToFixed3Strict(received.pure)} g</TableCell>
                    <TableCell
                      sx={{
                        color: "success.main",
                      }}
                    >
                      ₹{formatNumber(cashBalance + hallmarkBalance, 2)}
                    </TableCell>

                    <TableCell
                      sx={{
                        color: pureBalance > 0 ? "error.main" : "success.main",
                      }}
                    >
                      {formatToFixed3Strict(pureBalance)}g
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleViewBill(bill)}>
                        <VisibilityIcon color="primary" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
          <TableFooter>
            <TableRow
              sx={{
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
              <TableCell colSpan={2}>
                <strong>Total</strong>
              </TableCell>
              <TableCell>
                <strong>{formatToFixed3Strict(metrics.totalWeight)}</strong>
              </TableCell>
              <TableCell>
                <strong style={{ color: "yellow", fontSize: "1.1rem" }}>
                  {formatToFixed3Strict(metrics.totalPurity)}
                </strong>
              </TableCell>
              <TableCell>
                <strong>₹{formatNumber(metrics.totalSales, 2)}</strong>
              </TableCell>
              <TableCell>
                <strong>
                  ₹
                  {formatNumber(
                    metrics.cashReceived + metrics.hallmarkReceived,
                    2
                  )}
                </strong>
              </TableCell>
              <TableCell>
                <strong style={{ color: "yellow", fontSize: "1.1rem" }}>
                  {formatToFixed3Strict(metrics.pureReceived)} g
                </strong>
              </TableCell>
              <TableCell>
                <strong>
                  ₹ {formatNumber(calculateTotalCashBalance(), 2)}
                </strong>
              </TableCell>
              <TableCell colSpan={2}>
                <strong>{formatToFixed3Strict(metrics.outstandingPure)} g</strong>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

      <Modal open={viewModalOpen} onClose={handleCloseModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          {selectedBill && (
            <>
              <Typography variant="h6" gutterBottom>
                Bill Details - {selectedBill.billNo}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  <strong>Date:</strong>{" "}
                  {new Date(selectedBill.date).toLocaleDateString()}
                </Typography>
                <Typography variant="body1">
                  <strong>Customer:</strong> {selectedBill.customer.name}
                </Typography>
                <Typography variant="body1">
                  <strong>Total Purity:</strong>{" "}
                  {formatToFixed3Strict(selectedBill.totalPurity)}g
                </Typography>
              </Box>

              <Typography variant="subtitle1" gutterBottom>
                Items
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Coin</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Weight</TableCell>
                      <TableCell>Purity</TableCell>
                    </TableRow>
                  </TableHead>
                  {/* new commit  */}
                  <TableBody>
                    {selectedBill.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.coinValue}g{item.percentage}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatToFixed3Strict(item.weight)}</TableCell>
                        <TableCell>{formatToFixed3Strict(item.purity)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="subtitle1" gutterBottom>
                Received Details
              </Typography>
              {selectedBill.receivedDetails?.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Purity Weight</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Paid Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedBill.receivedDetails.map((detail, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {new Date(detail.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {detail.givenGold ? "Gold" : "Cash"}
                          </TableCell>
                          <TableCell>
                            {formatToFixed3Strict(detail.purityWeight) || "-"}
                          </TableCell>
                          <TableCell>
                            {formatNumber(detail.amount, 2) || "-"}
                          </TableCell>
                          <TableCell>
                            {formatNumber(detail.paidAmount, 2) || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2">No received details</Typography>
              )}

              <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                <Button variant="contained" onClick={handleCloseModal}>
                  Close
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredBills.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};

export default DailySalesReport;
