import React from "react";
import {
  Box,
  Modal,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import "./Billing.css";

const ViewBill = ({
  fetchedBills,
  customers,
  viewBill,
  deleteBill,
  setViewMode,
}) => {
  return (
    <Modal
      open={true}
      onClose={() => setViewMode(false)}
      aria-labelledby="view-bills-modal"
    >
      <Box
        className="modal-container"
        style={{ maxHeight: "80vh", overflowY: "auto" }}
      >
        <Typography variant="h6" gutterBottom>
          Select a Bill to View
        </Typography>

        <button className="close-btnsss" onClick={() => setViewMode(false)}>
          ×
        </button>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="th">Bill No</TableCell>
              <TableCell className="th">Customer</TableCell>
              <TableCell className="th">Date</TableCell>
              <TableCell className="th">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fetchedBills.map((bill) => (
              <TableRow key={bill.id}>
                <TableCell className="td">BILL-{bill.id}</TableCell>
                <TableCell className="td">
                  {customers.find((c) => c.id === bill.customerId)?.name ||
                    "Unknown"}
                </TableCell>
                <TableCell className="td">
                 {new Date(bill.createdAt).toLocaleDateString("en-GB")}
                </TableCell>
                <TableCell className="td">
                  <Box display="flex" gap={1}>
                    <Button variant="outlined" onClick={() => viewBill(bill)}>
                      View
                    </Button>
                    <Button variant="outlined" onClick={() => deleteBill(bill)}>
                      Delete
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Modal>
  );
};

export default ViewBill;
