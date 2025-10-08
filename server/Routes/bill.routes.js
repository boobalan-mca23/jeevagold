const express = require("express");
const router = express.Router();
const billController = require("../Controllers/bill.controller");

router.post("/", billController.createBill);
router.get("/", billController.getBills);
router.get("/:id", billController.getBillById);
router.patch("/:id/receive", billController.addReceiveEntry);
router.delete("/:id", billController.deleteBill);

module.exports = router;
