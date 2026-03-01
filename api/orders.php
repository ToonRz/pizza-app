<?php
// เชื่อมต่อฐานข้อมูล
$host = "localhost";
$user = "root"; // ค่าเริ่มต้นของ XAMPP
$pass = "";
$dbname = "my_database"; // เปลี่ยนเป็นชื่อฐานข้อมูลของคุณ

$conn = new mysqli($host, $user, $pass, $dbname);

// เช็คการเชื่อมต่อ
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// รับข้อมูล JSON ที่ส่งมาจาก React
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["status" => "error", "message" => "Invalid data"]);
    exit;
}

// ดึงข้อมูลจาก JSON
$name = $data['customerName'];
$address = $data['customerAddress'];
$phone = $data['customerPhone'];
$totalPrice = $data['totalPrice'];
$items = json_encode($data['items']); // แปลงเป็น JSON

// บันทึกข้อมูลลงฐานข้อมูล
$sql = "INSERT INTO orders (customer_name, customer_address, customer_phone, items, total_price) 
        VALUES ('$name', '$address', '$phone', '$items', '$totalPrice')";

if ($conn->query($sql) === TRUE) {
    echo json_encode(["status" => "success", "message" => "Order placed successfully"]);
} else {
    echo json_encode(["status" => "error", "message" => "Error: " . $conn->error]);
}

$conn->close();
?>
