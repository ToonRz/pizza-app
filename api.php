<?php
header("Access-Control-Allow-Origin: http://localhost:3000"); // Replace with your frontend URL
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true"); // Allow credentials (cookies)
header("Content-Type: application/json");

session_start();

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "my_database";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error]));
}

// Get the action parameter
$action = $_GET['action'] ?? '';

if ($action == 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['name']) || !isset($data['phone'])) {
        echo json_encode(["success" => false, "message" => "Invalid data"]);
        exit;
    }

    $name = $conn->real_escape_string($data['name']);
    $phone = $conn->real_escape_string($data['phone']);

    // Check for admin credentials
    if ($data['name'] === 'admin' && $data['phone'] === 'admin') {
        $_SESSION['admin'] = true;
        echo json_encode([
            "success" => true,
            "user" => ["name" => "admin", "phone" => "admin", "isAdmin" => true]
        ]);
        exit;
    }

    // Check if user has any orders
    $sql = "SELECT * FROM orders 
            WHERE customer_name = '$name' 
            AND customer_phone = '$phone'
            LIMIT 1";
    
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        // User exists (has orders)
        echo json_encode([
            "success" => true,
            "user" => [
                "name" => $name,
                "phone" => $phone
            ]
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "No orders found with these details"]);
    }
} elseif ($action == 'getOrders') {
    $customerName = $_GET['customerName'] ?? '';
    $customerPhone = $_GET['customerPhone'] ?? '';

    if (empty($customerName) || empty($customerPhone)) {
        echo json_encode(["success" => false, "message" => "Customer name and phone are required"]);
        exit;
    }

    $customerName = $conn->real_escape_string($customerName);
    $customerPhone = $conn->real_escape_string($customerPhone);

    $sql = "SELECT id, customer_name, customer_phone, customer_address, items, total_price, status, created_at 
            FROM orders 
            WHERE customer_name = '$customerName' 
            AND customer_phone = '$customerPhone'
            ORDER BY created_at DESC";
    
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $orders = [];
        while ($row = $result->fetch_assoc()) {
            $orders[] = [
                "id" => $row['id'],
                "customer_name" => $row['customer_name'],
                "customer_phone" => $row['customer_phone'],
                "customer_address" => $row['customer_address'],
                "order_date" => $row['created_at'],
                "items" => json_decode($row['items'], true),
                "total_price" => $row['total_price'],
                "status" => $row['status'] ?? "Processing"
            ];
        }
        echo json_encode(["success" => true, "orders" => $orders]);
    } else {
        echo json_encode(["success" => false, "message" => "No orders found"]);
    }
} elseif ($action == 'getAllOrders') {
    // Check if admin session exists
    if (!isset($_SESSION['admin']) || $_SESSION['admin'] !== true) {
        http_response_code(401); // Unauthorized
        echo json_encode([
            "success" => false, 
            "message" => "Unauthorized: Admin access required"
        ]);
        exit;
    }

    $sql = "SELECT * FROM orders ORDER BY created_at DESC";
    $result = $conn->query($sql);
    
    $orders = [];
    while ($row = $result->fetch_assoc()) {
        $orders[] = [
            "id" => $row['id'],
            "customer_name" => $row['customer_name'],
            "customer_phone" => $row['customer_phone'],
            "customer_address" => $row['customer_address'],
            "order_date" => $row['created_at'],
            "items" => json_decode($row['items'], true),
            "total_price" => $row['total_price'],
            "status" => $row['status'] ?? "Processing"
        ];
    }
    
    echo json_encode(["success" => true, "orders" => $orders]);
} elseif ($action == 'placeOrder') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['customerName']) || !isset($data['customerPhone']) || 
        !isset($data['customerAddress']) || !isset($data['items']) || !isset($data['totalPrice'])) {
        echo json_encode(["success" => false, "message" => "Invalid data"]);
        exit;
    }

    $customerName = $conn->real_escape_string($data['customerName']);
    $customerPhone = $conn->real_escape_string($data['customerPhone']);
    $customerAddress = $conn->real_escape_string($data['customerAddress']);
    $items = $conn->real_escape_string(json_encode($data['items']));
    $totalPrice = $conn->real_escape_string($data['totalPrice']);
    $status = "Processing"; // Default status

    $sql = "INSERT INTO orders (customer_name, customer_phone, customer_address, items, total_price, status, created_at)
            VALUES ('$customerName', '$customerPhone', '$customerAddress', '$items', '$totalPrice', '$status', NOW())";

    if ($conn->query($sql)) {
        echo json_encode(["success" => true, "message" => "Order placed successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Error: " . $conn->error]);
    }
} elseif ($action == 'updateOrderStatus') {
    // Verify admin session
    if (!isset($_SESSION['admin']) || $_SESSION['admin'] !== true) {
        echo json_encode(["success" => false, "message" => "Unauthorized"]);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['orderId']) || !isset($data['status'])) {
        echo json_encode(["success" => false, "message" => "Invalid data"]);
        exit;
    }

    $orderId = $conn->real_escape_string($data['orderId']);
    $status = $conn->real_escape_string($data['status']);

    // Validate status
    $validStatuses = ["Processing", "Preparing", "Delivered"];
    if (!in_array($status, $validStatuses)) {
        echo json_encode(["success" => false, "message" => "Invalid status"]);
        exit;
    }

    $sql = "UPDATE orders SET status = '$status' WHERE id = '$orderId'";

    if ($conn->query($sql)) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "message" => "Error: " . $conn->error]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid action"]);
}

$conn->close();
?>