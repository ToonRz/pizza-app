const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");

// ประกาศตัวแปรเพียงครั้งเดียว
const app = express();
const port = 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// สร้างการเชื่อมต่อกับ MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "pizza_shop",
});

// เชื่อมต่อกับ MySQL
db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

// สร้าง API สำหรับบันทึกการสั่งซื้อ
app.post("/api/orders", (req, res) => {
  const { customerName, customerAddress, customerPhone, items, totalPrice } = req.body;

  const query = `
    INSERT INTO orders (customer_name, customer_address, customer_phone, items, total_price)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(
    query,
    [customerName, customerAddress, customerPhone, JSON.stringify(items), totalPrice],
    (err, result) => {
      if (err) {
        console.error("Error saving order:", err);
        res.status(500).send("Error saving order");
      } else {
        console.log("Order saved successfully");
        res.status(200).send("Order saved successfully");
      }
    }
  );
});

// เริ่มต้นเซิร์ฟเวอร์
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});