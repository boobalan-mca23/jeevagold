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
  TablePagination,
  IconButton,
  Modal,
  Button,
} from "@mui/material";
import { BACKEND_SERVER_URL } from "../../Config/Config";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { formatNumber } from "../../utils/formatNumber";
import { formatToFixed3Strict } from "../../utils//formatToFixed3Strict";

const BalanceReport = () => {
  const [customers, setCustomers] = useState([]);
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [combinedBalances, setCombinedBalances] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedBill, setSelectedBill] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, billsRes] = await Promise.all([
          fetch(`${BACKEND_SERVER_URL}/api/customers`),
          fetch(`${BACKEND_SERVER_URL}/api/bills`),
        ]);
        const customersData = await customersRes.json();
        const billsData = await billsRes.json();

        setCustomers(customersData);
        setBills(billsData);
        calculateCombinedBalances(customersData, billsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const calculateBillBalance = (bill) => {
    if (!bill.receivedDetails || bill.receivedDetails.length === 0) {
      return bill.totalPurity;
    }

    let receivedPurity = 0;

    bill.receivedDetails.forEach((detail) => {
      if (detail.paidAmount) {
        receivedPurity -= detail.purityWeight || 0;
      } else {
        receivedPurity += detail.purityWeight || 0;
      }
    });

    return bill.totalPurity - receivedPurity;
  };

  const calculateCombinedBalances = (customersData, billsData) => {
    const balances = [];

    customersData.forEach((customer) => {
      const customerBills = billsData.filter(
        (bill) => bill.customerId === customer.id
      );

      let customerOwed = 0;
      let ownerOwed = 0;
      const customerBillsWithBalance = [];
      const ownerBillsWithBalance = [];

      customerBills.forEach((bill) => {
        const balance = calculateBillBalance(bill);
        const balancefix = balance.toFixed(3);

        if (balancefix > 0) {
          customerOwed += balance;
          customerBillsWithBalance.push({
            ...bill,
            balance,
          });
        } else if (balancefix < 0) {
          ownerOwed += Math.abs(balance);
          ownerBillsWithBalance.push({
            ...bill,
            balance: Math.abs(balance),
          });
        }
      });

      if (customerOwed > 0 || ownerOwed > 0) {
        balances.push({
          customerId: customer.id,
          customerName: customer.name,
          customerOwed,
          ownerOwed,
          customerBillsWithBalance,
          ownerBillsWithBalance,
        });
      }
    });

    setCombinedBalances(balances);
  };

  const handleViewBills = (customerId, isCustomerOwed) => {
    const customer = combinedBalances.find((c) => c.customerId === customerId);
    if (customer) {
      setFilteredBills(
        isCustomerOwed
          ? customer.customerBillsWithBalance
          : customer.ownerBillsWithBalance
      );
    }
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

  const totalCustomerOutstandingBalance = combinedBalances.reduce(
    (sum, customer) => sum + customer.customerOwed,
    0
  );
  const totalOwnerOutstandingBalance = combinedBalances.reduce(
    (sum, customer) => sum + customer.ownerOwed,
    0
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ textAlign: "center" }}>
        Balance Report
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 2,
          mb: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Customer Balances
        </Typography>

        <Box sx={{ display: "flex", gap: 3 }}>
          <Typography variant="subtitle1">
            Total Customer Owes:{" "}
            <strong>{formatToFixed3Strict(totalCustomerOutstandingBalance)}g</strong>
          </Typography>
          <Typography variant="subtitle1">
            Total Owner Owes:{" "}
            <strong>{formatToFixed3Strict(totalOwnerOutstandingBalance)}g</strong>
          </Typography>
        </Box>
      </Box>

      {combinedBalances.length > 0 ? (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Customer Owes (grams)</TableCell>
                  <TableCell>Owner Owes (grams)</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {combinedBalances
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((customer) => (
                    <TableRow key={customer.customerId}>
                      <TableCell>{customer.customerName}</TableCell>
                      <TableCell>
                        {customer.customerOwed > 0
                          ? formatToFixed3Strict(customer.customerOwed)
                          : "0"}
                      </TableCell>
                      <TableCell>
                        {customer.ownerOwed > 0
                          ? formatToFixed3Strict(customer.ownerOwed)
                          : "0"}
                      </TableCell>
                      <TableCell>
                        {customer.customerOwed > 0 && (
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ mr: 1 }}
                            onClick={() =>
                              handleViewBills(customer.customerId, true)
                            }
                          >
                            View Customer Bills (
                            {customer.customerBillsWithBalance.length})
                          </Button>
                        )}
                        {customer.ownerOwed > 0 && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() =>
                              handleViewBills(customer.customerId, false)
                            }
                          >
                            View Owner Bills (
                            {customer.ownerBillsWithBalance.length})
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={combinedBalances.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      ) : (
        <Typography variant="body1" sx={{ mt: 2 }}>
          No outstanding balances found
        </Typography>
      )}

      {filteredBills.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Outstanding Bills
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Bill No</TableCell>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Total Purity</TableCell>
                  <TableCell>Balance</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>{bill.billNo}</TableCell>
                    <TableCell>{bill.customer.name}</TableCell>
                    <TableCell>
                      {new Date(bill.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{formatToFixed3Strict(bill.totalPurity)}</TableCell>
                    <TableCell>
                      {formatToFixed3Strict(bill.balance) || "0"} grams
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleViewBill(bill)}>
                        <VisibilityIcon color="primary" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

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

              <Typography variant="body1">
                <strong>Customer:</strong>{" "}
                {selectedBill.customer?.name || "Unknown"}
              </Typography>
              <Typography variant="body1">
                <strong>Date:</strong>{" "}
                {new Date(selectedBill.date).toLocaleDateString()}
              </Typography>
              <Typography variant="body1">
                <strong>Total Purity:</strong>{" "}
                {formatToFixed3Strict(selectedBill.totalPurity)}g
              </Typography>
              <Typography
                variant="body1"
                color={
                  calculateBillBalance(selectedBill) > 0 ? "error" : "success"
                }
              >
                <strong>Balance:</strong>
                {calculateBillBalance(selectedBill) > 0
                  ? `Customer owes: ${formatToFixed3Strict(
                      calculateBillBalance(selectedBill)
                    )}g`
                  : `Owner owes: ${Math.abs(
                      formatToFixed3Strict(calculateBillBalance(selectedBill))
                    )}g`}
              </Typography>

              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Items
              </Typography>
              <TableContainer component={Paper} sx={{ mt: 1 }}>
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
                    {selectedBill.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.coinValue}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatToFixed3Strict(item.weight)}</TableCell>
                        <TableCell>{formatToFixed3Strict(item.purity)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Received Details
              </Typography>
              {selectedBill.receivedDetails?.length > 0 ? (
                <TableContainer component={Paper} sx={{ mt: 1 }}>
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
                <Typography variant="body2" sx={{ mt: 1 }}>
                  No received details
                </Typography>
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
    </Box>
  );
};

export default BalanceReport;
