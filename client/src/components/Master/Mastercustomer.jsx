import React, { useState, useEffect } from "react";
import "./Mastercustomer.css";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
 import Tooltip from '@mui/material/Tooltip';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BACKEND_SERVER_URL } from "../../Config/Config";

function MasterCustomer() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [customers, setCustomers] = useState([]);
  const [editCustomer, setEditCustomer] = useState(null);
  const [editedData, setEditedData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const openModal = () => {
    setIsModalOpen(true);
    setCustomerName("");
    setPhoneNumber("");
    setAddress("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${BACKEND_SERVER_URL}/api/customers`);
        const data = await response.json();
        setCustomers(data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    fetchCustomers();
  }, []);

  const handleSaveCustomer = async () => {
    if (customerName.trim() === "") {
      alert("Customer name is required.");
      return;
    }
    if (!/^[A-Za-z ]+$/.test(customerName.trim())) {
      toast.error("Customer name must contain only alphabets and spaces.");
      return;
    }

    const trimmedPhone = phoneNumber.trim();

    if (!/^\d+$/.test(trimmedPhone)) {
      toast.error("Phone number must contain only digits (0–9).");
      return;
    }

    if (trimmedPhone.length < 10) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }

    if (trimmedPhone.length > 10) {
      toast.error("Phone number must not exceed 10 digits.");
      return;
    }

    if (!/^[6-9]/.test(trimmedPhone)) {
      toast.error("Phone number must start with 6, 7, 8, or 9.");
      return;
    }
    const customerData = {
      name: customerName,
      phone: phoneNumber,
      address: address,
    };

    try {
      const response = await fetch(`${BACKEND_SERVER_URL}/api/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerData),
      });

      if (response.ok) {
        const newCustomer = await response.json();
        setCustomers((prev) => [...prev, newCustomer]);
        toast.success("Customer added successfully!");
        closeModal();
      } else {
        const err = await response.json();
        toast.error("Error: " + err.message);
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error("Something went wrong.");
    }
  };

  const handleEdit = (customer) => {
    setEditCustomer(customer);
    setEditedData({
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
    });
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch(
        `${BACKEND_SERVER_URL}/api/customers/${editCustomer.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editedData),
        }
      );

      if (response.ok) {
        const updated = await response.json();
        setCustomers(customers.map((c) => (c.id === updated.id ? updated : c)));
        setEditCustomer(null);
        toast.success("Customer updated successfully!");
      } else {
        console.error("Failed to update customer");
        toast.error("Failed to update customer.");
      }
    } catch (error) {
      console.error("Error updating customer:", error);
      toast.error("Error updating customer.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        const response = await fetch(
          `${BACKEND_SERVER_URL}/api/customers/${id}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          setCustomers(customers.filter((customer) => customer.id !== id));
          toast.success("Customer deleted successfully!");
        } else {
          const errorData = await response.json();
          console.error("Delete failed:", errorData);
          toast.error("Failed to delete customer.");
        }
      } catch (error) {
        console.error("Error deleting customer:", error);
        toast.error("Error deleting customer.");
      }
    }
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={1000}
        hideProgressBar={true}
        closeOnClick
        pauseOnHover={false}
        draggable={false}
      />

      <div className="customer-container">
        <Button
          style={{
            backgroundColor: "#F5F5F5",
            color: "black",
            borderColor: "#25274D",
            borderStyle: "solid",
            borderWidth: "2px",
          }}
          variant="contained"
          onClick={openModal}
        >
          Add Customer
        </Button>

        <Dialog open={isModalOpen} onClose={closeModal}>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Customer Name"
              type="text"
              fullWidth
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <TextField
              margin="dense"
              label="Phone Number"
              type="tel"
              fullWidth
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <TextField
              margin="dense"
              label="Address"
              type="text"
              fullWidth
              multiline
              rows={4}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeModal} color="secondary">
              Cancel
            </Button>
            <Button onClick={handleSaveCustomer} color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {customers.length > 0 && (
          <Paper className="customer-table">
            <table border="1" width="100%">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Phone Number</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, index) => (
                  <tr key={index}>
                    <td>{customer.name}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.address}</td>
                    <td>
                      {" "}
                      <Tooltip title="Edit Customer">
                        <IconButton onClick={() => handleEdit(customer)}>
                          <EditIcon color="secondary" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Customer">
                        <IconButton onClick={() => handleDelete(customer.id)}>
                          <DeleteIcon color="error" />
                        </IconButton>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Paper>
        )}

        <Dialog open={!!editCustomer} onClose={() => setEditCustomer(null)}>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogContent>
            <TextField
              label="Name"
              value={editedData.name}
              onChange={(e) =>
                setEditedData({ ...editedData, name: e.target.value })
              }
              fullWidth
              margin="normal"
            />
            <TextField
              label="Phone"
              value={editedData.phone}
              onChange={(e) =>
                setEditedData({ ...editedData, phone: e.target.value })
              }
              fullWidth
              margin="normal"
            />
            <TextField
              label="Address"
              value={editedData.address}
              onChange={(e) =>
                setEditedData({ ...editedData, address: e.target.value })
              }
              fullWidth
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditCustomer(null)}>Cancel</Button>
            <Button onClick={handleUpdate} variant="contained" color="primary">
              Update
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </>
  );
}

export default MasterCustomer;
