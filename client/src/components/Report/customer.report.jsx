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
  Autocomplete,
  TablePagination,
  IconButton,
  Modal,
  Alert,
  TableFooter,
} from "@mui/material";
import { BACKEND_SERVER_URL } from "../../Config/Config";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { formatNumber } from "../../utils/formatNumber";
import { formatToFixed3Strict } from "../../utils/formatToFixed3Strict";

const CustomerReport = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedBill, setSelectedBill] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
    setEndDate(today);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, billsRes, transactionsRes] = await Promise.all([
          fetch(`${BACKEND_SERVER_URL}/api/customers`),
          fetch(`${BACKEND_SERVER_URL}/api/bills`),
          fetch(`${BACKEND_SERVER_URL}/api/transactions/all`),
        ]);

        const customersData = await customersRes.json();
        const billsData = await billsRes.json();
        const transactionsData = await transactionsRes.json();

        setCustomers(customersData);
        setBills(billsData);
        setFilteredBills(billsData);
        setTransactions(transactionsData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let result = bills;

    if (selectedCustomer) {
      result = result.filter((bill) => bill.customerId === selectedCustomer.id);
    }

    if (startDate) {
      result = result.filter(
        (bill) => new Date(bill.date) >= new Date(startDate)
      );
    }

    if (endDate) {
      result = result.filter(
        (bill) => new Date(bill.date) <= new Date(endDate + "T23:59:59")
      );
    }

    setFilteredBills(result);
    setPage(0);
  }, [selectedCustomer, startDate, endDate, bills]);

  const calculateBillBalance = (bill, customerId) => {
    if (!bill?.receivedDetails || !Array.isArray(bill.receivedDetails)) {
      return {
        balance: bill?.totalPurity || 0,
        advanceUsed: 0,
        remainingAdvance: 0,
      };
    }

    const customerAdvances = transactions
      .filter(
        (txn) =>
          txn.customerId === customerId &&
          new Date(txn.date) <= new Date(bill.date)
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const previousBills = bills
      .filter(
        (b) =>
          b.customerId === customerId && new Date(b.date) < new Date(bill.date)
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    let remainingAdvance = customerAdvances.reduce(
      (sum, txn) => sum + (txn.purity || 0),
      0
    );

    previousBills.forEach((prevBill) => {
      const prevBalance = calculateBillBalance(prevBill, customerId);
      remainingAdvance -= prevBalance.advanceUsed;
    });

    let receivedPurity = bill.receivedDetails.reduce((sum, detail) => {
      if (detail.paidAmount) {
        return sum - (detail.purityWeight || 0);
      }
      return sum + (detail.purityWeight || 0);
    }, 0);

    let advanceUsed = 0;
    let usedFromAdvance = 0;
    let advanceUsedForBal = {};

    const balance = (bill.totalPurity || 0) - receivedPurity;

    if (balance >= 0) {
      if (remainingAdvance > 0) {
        advanceUsed = Math.min(remainingAdvance, balance);
        remainingAdvance -= advanceUsed;
      }
    } else {
      const excess = Math.abs(balance);
      usedFromAdvance = Math.min(remainingAdvance, excess);

      if (usedFromAdvance > 0) {
        advanceUsedForBal[bill.id] = usedFromAdvance;
        advanceUsed += usedFromAdvance;
        remainingAdvance -= usedFromAdvance;
      }
    }

    return {
      balance,
      advanceUsed,
      remainingAdvance,
      advanceUsedForBal,
      usedFromAdvance,
    };
  };

  const getBillDescription = (bill) => {
    if (!bill.items || bill.items.length === 0) return "-";

    const item = bill.items[0];
    return (
      <>
        <div>{`${item.coinValue}g ${item.percentage} (touch ${item.touch}) x ${item.quantity}`}</div>
        <div>Total Purity: {formatToFixed3Strict(bill.totalPurity)}g</div>
      </>
    );
  };

  const getReceivedDetailsSummary = (bill) => {
    if (!bill.receivedDetails || !Array.isArray(bill.receivedDetails)) {
      return "No payments received";
    }

    const balanceInfo = calculateBillBalance(bill, bill.customerId);
    const totalReceived = bill.receivedDetails.reduce((sum, detail) => {
      return sum + Math.abs(detail.purityWeight || 0);
    }, 0);

    return (
      <>
        <div>Received: {formatNumber(totalReceived, 3)}g</div>
        {balanceInfo.advanceUsed > 0 && !(balanceInfo.usedFromAdvance > 0) && (
          <div>
            Advance applied: {formatToFixed3Strict(balanceInfo.advanceUsed)}g
          </div>
        )}
        {balanceInfo.remainingAdvance > 0 &&
          !(balanceInfo.usedFromAdvance > 0) && (
            <div>
              Advance available:{" "}
              {formatToFixed3Strict(balanceInfo.remainingAdvance)}g
            </div>
          )}
      </>
    );
  };

  const getCustomerBalanceDetails = (bill) => {
    if (!bill.receivedDetails || !Array.isArray(bill.receivedDetails)) {
      return "No payments received";
    }

    const balanceInfo = calculateBillBalance(bill, bill.customerId);

    const customerBalance = balanceInfo.balance > 0 ? balanceInfo.balance : 0;

    return (
      <>
        {balanceInfo.advanceUsed > 0 && !(balanceInfo.usedFromAdvance > 0) ? (
          <div>
            {formatToFixed3Strict(Math.abs(balanceInfo.advanceUsed - customerBalance))}g
          </div>
        ) : (
          <div>{formatToFixed3Strict(customerBalance)}g</div>
        )}
      </>
    );
  };

  const getCustomerBalanceDetailss = (bill) => {
    if (!bill.receivedDetails || !Array.isArray(bill.receivedDetails)) {
      return "No payments received";
    }

    const balanceInfo = calculateBillBalance(bill, bill.customerId);

    const customerBalance = balanceInfo.balance > 0 ? balanceInfo.balance : 0;

    if (balanceInfo.advanceUsed > 0 && !(balanceInfo.usedFromAdvance > 0)) {
      return balanceInfo.advanceUsed - customerBalance;
    } else {
      return customerBalance;
    }
  };

const calculateTotalCustomerBalance = () => {
  return filteredBills.reduce((total, bill) => {
    return total + Math.abs(getCustomerBalanceDetailss(bill));
  }, 0);
};

  const getAdvanceDetailsSummary = (bill) => {
    if (!bill.receivedDetails || !Array.isArray(bill.receivedDetails)) {
      return "No payments received";
    }

    const balanceInfo = calculateBillBalance(bill, bill.customerId);

    const ownerBalance = balanceInfo.balance < 0 ? balanceInfo.balance : 0;

    return (
      <>
        <div>Balance: {formatNumber(ownerBalance, 3)}g</div>
        {balanceInfo.usedFromAdvance > 0 && (
          <div>
            Advance applied: {formatToFixed3Strict(balanceInfo.usedFromAdvance)}
            g
          </div>
        )}
        {balanceInfo.usedFromAdvance > 0 && (
          <div>
            Advance available:{" "}
            {formatToFixed3Strict(balanceInfo.remainingAdvance)}g
          </div>
        )}
      </>
    );
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
    setViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setViewModalOpen(false);
    setSelectedBill(null);
  };

  const calculateTotalReceived = () => {
    return filteredBills.reduce((total, bill) => {
      if (!bill.receivedDetails) return total;

      const billReceived = bill.receivedDetails.reduce((sum, detail) => {
        return sum + Math.abs(detail.purityWeight || 0);
      }, 0);

      return total + billReceived;
    }, 0);
  };

  const calculateTotalPurity = () => {
    return filteredBills.reduce(
      (sum, bill) => sum + (bill.totalPurity || 0),
      0
    );
  };

  const getFilteredTransactions = () => {
    let result = transactions;

    if (selectedCustomer) {
      result = result.filter((txn) => txn.customerId === selectedCustomer.id);
    }

    if (startDate) {
      result = result.filter(
        (txn) => new Date(txn.date) >= new Date(startDate)
      );
    }

    if (endDate) {
      result = result.filter(
        (txn) => new Date(txn.date) <= new Date(endDate + "T23:59:59")
      );
    }

    return result;
  };

  const calculateTotalAdvanceAvailable = () => {
    const filteredTxns = getFilteredTransactions();
    console.log("filtered transssss", filteredTxns);
    return filteredTxns.reduce((sum, txn) => sum + (txn.purity || 0), 0);
  };

  const calculateCashBalances = (bill) => {
    if (!bill.receivedDetails || !Array.isArray(bill.receivedDetails)) {
      return {
        customerCashBalance: 0,
        ownerCashBalance: 0,
      };
    }

    const recentDetail = [...bill.receivedDetails]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .find((detail) => detail.goldRate);

    const goldRate = recentDetail?.goldRate || 0;

    const balanceInfo = calculateBillBalance(bill, bill.customerId);
    const customerBalance = balanceInfo.balance > 0 ? balanceInfo.balance : 0;
    const ownerBalance = balanceInfo.balance < 0 ? balanceInfo.balance : 0;

    return {
      customerCashBalance: customerBalance * goldRate + bill.hallmarkBalance,
      ownerCashBalance: ownerBalance * goldRate,
    };
  };

  const calculateTotalCustomerCashBalance = () => {
    return filteredBills.reduce((total, bill) => {
      const cashBalances = calculateCashBalances(bill);
      return total + cashBalances.customerCashBalance;
    }, 0);
  };

  const calculateTotalOwnerCashBalance = () => {
    return filteredBills.reduce((total, bill) => {
      const cashBalances = calculateCashBalances(bill);
      return total + cashBalances.ownerCashBalance;
    }, 0);
  };

  const handleReset = () => {
    setSelectedCustomer(null);
    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
    setEndDate(today);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography style={{ textAlign: "center" }} variant="h5" gutterBottom>
        Customer Report
      </Typography>
      <br />
      <br />

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Autocomplete
          options={customers}
          getOptionLabel={(option) => option.name}
          value={selectedCustomer}
          onChange={(event, newValue) => setSelectedCustomer(newValue)}
          renderInput={(params) => (
            <TextField {...params} label="Select Customer" variant="outlined" />
          )}
          sx={{ minWidth: 300 }}
        />

        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 200 }}
        />

        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 200 }}
        />

        <Button variant="outlined" onClick={handleReset}>
          Clear
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Bill No</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Received Details</TableCell>
              <TableCell>Advance Balance</TableCell>
              <TableCell>Customer Balance</TableCell>
              <TableCell>Customer Cash Balance</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBills
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((bill) => {
                const balanceInfo = calculateBillBalance(bill, bill.customerId);

                const customerBalance =
                  balanceInfo.balance > 0 ? balanceInfo.balance : 0;

                const cashBalances = calculateCashBalances(bill);

                return (
                  <TableRow key={bill.id}>
                    <TableCell>{bill.id}</TableCell>
                    <TableCell>
                      {new Date(bill.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getBillDescription(bill)}</TableCell>
                    <TableCell>{getReceivedDetailsSummary(bill)}</TableCell>
                    <TableCell>{getAdvanceDetailsSummary(bill)}</TableCell>
                    <TableCell> {getCustomerBalanceDetails(bill)} </TableCell>
                    <TableCell>
                      ₹{formatNumber(cashBalances.customerCashBalance, 2)}
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
              <TableCell colSpan={2} align="right">
                <strong>Totals:</strong>
              </TableCell>
              <TableCell>
                <strong>{formatToFixed3Strict(calculateTotalPurity())}g</strong>
              </TableCell>
              <TableCell>
                <div>
                  <strong>
                    Received: {formatToFixed3Strict(calculateTotalReceived())}g
                  </strong>
                </div>
                <div>
                  <strong>
                    Advance:{" "}
                    {formatToFixed3Strict(calculateTotalAdvanceAvailable())}g
                  </strong>
                </div>
                <div
                  style={{
                    borderTop: "1px solid #ccc",
                    marginTop: 4,
                    paddingTop: 4,
                  }}
                >
                  <strong>
                    Total:{" "}
                    {formatToFixed3Strict(
                      calculateTotalReceived() +
                        calculateTotalAdvanceAvailable()
                    )}
                    g
                  </strong>
                </div>
              </TableCell>

              <TableCell></TableCell>

              <TableCell>
                <strong>
                 
                   {formatToFixed3Strict(calculateTotalCustomerBalance())}
                  g
                </strong>
              </TableCell>
              <TableCell>
                ₹ {formatNumber(calculateTotalCustomerCashBalance(), 2)}
              </TableCell>

              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredBills.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

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
                  <strong>Customer:</strong>{" "}
                  {customers.find((c) => c.id === selectedBill.customerId)
                    ?.name || "Unknown"}
                </Typography>
                <Typography variant="body1">
                  <strong>Total Purity:</strong>{" "}
                  {formatToFixed3Strict(selectedBill.totalPurity)}g
                </Typography>
                <Typography variant="body1">
                  <strong>Balance:</strong>{" "}
                  {(() => {
                    const { balance } = calculateBillBalance(
                      selectedBill,
                      selectedBill.customerId
                    );
                    return balance > 0
                      ? `Customer owes: ${formatToFixed3Strict(balance)}g`
                      : `Owner owes: ${formatToFixed3Strict(
                          Math.abs(balance)
                        )}g`;
                  })()}
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
                  <TableBody>
                    {/* new commit  */}
                    {selectedBill.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {item.coinValue}g{item.percentage}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          {formatToFixed3Strict(item.weight)}
                        </TableCell>
                        <TableCell>
                          {formatToFixed3Strict(item.purity)}
                        </TableCell>
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

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Advance Payments
              </Typography>
              {transactions
                .filter(
                  (txn) =>
                    txn.customerId === selectedBill.customerId &&
                    new Date(txn.date) <= new Date(selectedBill.date)
                )
                .map((txn, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      {new Date(txn.date).toLocaleDateString()} - Advance:{" "}
                      {formatToFixed3Strict(txn.purity) || 0}g
                    </Typography>
                  </Box>
                ))}

              <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                <Button variant="contained" onClick={handleCloseModal}>
                  Close
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default CustomerReport;
