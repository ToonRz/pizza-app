import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import pizzaShopImg from "./assets/pizza_shop.jpg";
import MargheritaPizza from "./assets/Margherita_pizza.jpg";
import PepperoniPizza from "./assets/Papperoni_pizza.jpg";
import VeggiePizza from "./assets/Veggie_pizza.jpg";
import HawaiianPizza from "./assets/Hawaiian_Pizza.jpg";
import BBQChickenPizza from "./assets/BBQ_chicken_Pizza.jpg";
import MeatLoversPizza from "./assets/Meat_Pizza.jpg";
import { Modal, Button, Form, Tab, Tabs, Table } from "react-bootstrap";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    address: "",
    phone: "",
  });
  const [loginInfo, setLoginInfo] = useState({
    name: "",
    phone: "",
  });
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("menu");

  // Toggle menu
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Add pizza to cart
  const addToCart = (pizza) => {
    const existingPizza = cart.find((item) => item.name === pizza.name);

    if (existingPizza) {
      setCart(
        cart.map((item) =>
          item.name === pizza.name
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...pizza, quantity: 1 }]);
    }
  };

  // Decrease quantity in cart
  const decreaseQuantity = (pizzaName) => {
    const updatedCart = cart.map((item) =>
      item.name === pizzaName
        ? { ...item, quantity: item.quantity - 1 }
        : item
    );

    setCart(updatedCart.filter((item) => item.quantity > 0));
  };

  // Open checkout modal
  const handleCheckout = () => {
    setShowCheckoutModal(true);
  };

  // Close checkout modal
  const handleCloseCheckoutModal = () => {
    setShowCheckoutModal(false);
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo({ ...customerInfo, [name]: value });
  };

  // Handle login input change
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginInfo({ ...loginInfo, [name]: value });
  };

  const submitOrder = async () => {
    if (!customerInfo.name || !customerInfo.address || !customerInfo.phone) {
      alert("Please fill in all customer details.");
      return;
    }

    try {
      const orderData = {
        customerName: customerInfo.name,
        customerAddress: customerInfo.address,
        customerPhone: customerInfo.phone,
        items: cart,
        totalPrice: calculateTotalPrice(),
      };

      const response = await fetch("http://localhost/pizza-app/api.php?action=placeOrder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Send cookies
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (result.success) {
        alert("Order placed successfully!");
        setCart([]);
        setShowCheckoutModal(false);
        
        // Automatically log in the user
        setUser({
          name: customerInfo.name,
          phone: customerInfo.phone,
        });
        
        // Fetch their orders
        fetchUserOrders(customerInfo.name, customerInfo.phone);
        
        // Reset customer info
        setCustomerInfo({ name: "", address: "", phone: "" });
      } else {
        alert("Failed to place order: " + result.message);
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleLogin = async () => {
    if (!loginInfo.name || !loginInfo.phone) {
      alert("Please enter both name and phone number");
      return;
    }

    try {
      const response = await fetch("http://localhost/pizza-app/api.php?action=login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Send cookies
        body: JSON.stringify({
          name: loginInfo.name,
          phone: loginInfo.phone,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setUser(result.user);
        setShowLoginModal(false);
        if (result.user.isAdmin) {
          await fetchAllOrders(); // Fetch orders immediately for admin
          setShowAdminModal(true);
        } else {
          fetchUserOrders(result.user.name, result.user.phone);
        }
        alert("Login successful!");
      } else {
        alert("Login failed: " + result.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setOrders([]);
    setAllOrders([]);
    setLoginInfo({ name: "", phone: "" });
    alert("Logged out successfully!");
  };

  const fetchUserOrders = async (name, phone) => {
    try {
      const response = await fetch(
        `http://localhost/pizza-app/api.php?action=getOrders&customerName=${encodeURIComponent(name)}&customerPhone=${encodeURIComponent(phone)}`,
        { credentials: "include" } // Send cookies
      );
      const result = await response.json();

      if (result.success) {
        setOrders(result.orders);
      } else {
        console.error("Failed to fetch orders:", result.message);
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    }
  };

  const fetchAllOrders = async () => {
    try {
      const response = await fetch("http://localhost/pizza-app/api.php?action=getAllOrders", {
        method: "GET",
        credentials: "include", // Send cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setAllOrders(result.orders);
      } else {
        alert(result.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      if (error.message.includes("Unauthorized")) {
        alert("Admin access required. Please log in as admin.");
        setShowLoginModal(true); // Prompt login if unauthorized
      } else {
        alert("Error fetching orders: " + error.message);
      }
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch("http://localhost/pizza-app/api.php?action=updateOrderStatus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Send cookies
        body: JSON.stringify({
          orderId,
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error("Failed to update order status:", result.message);
        alert("Failed to update order status: " + result.message);
      } else {
        // Refresh the orders list
        fetchAllOrders();
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("An error occurred while updating order status");
    }
  };

  const openOrdersModal = () => {
    if (user) {
      fetchUserOrders(user.name, user.phone);
      setShowOrdersModal(true);
    } else {
      setShowLoginModal(true);
    }
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <div className="App">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <a className="navbar-brand" href="#">
            🍕 PizzaOneFiveOne
          </a>
          <button className="navbar-toggler" type="button" onClick={toggleMenu}>
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className={`collapse navbar-collapse ${menuOpen ? "show" : ""}`}>
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <a className="nav-link" href="#menu" onClick={() => setActiveTab("menu")}>
                  Menu
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#cart" onClick={() => setActiveTab("cart")}>
                  Cart ({cart.length})
                </a>
              </li>
              {user ? (
                <>
                  {user?.isAdmin && (
                    <li className="nav-item">
                      <button
                        className="nav-link"
                        onClick={async () => {
                          await fetchAllOrders();
                          setShowAdminModal(true);
                        }}
                      >
                        Admin
                      </button>
                    </li>
                  )}
                  <li className="nav-item">
                    <a className="nav-link" href="#orders" onClick={openOrdersModal}>
                      My Orders
                    </a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="#logout" onClick={handleLogout}>
                      Logout
                    </a>
                  </li>
                </>
              ) : (
                <li className="nav-item">
                  <a className="nav-link" href="#login" onClick={() => setShowLoginModal(true)}>
                    Login
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section text-center">
        <div
          className="hero-image"
          style={{ backgroundImage: `url(${pizzaShopImg})` }}
        ></div>
        <div className="container hero-content">
          <h1 className="display-4 text-white">
            Delicious Pizza Delivered to Your Doorstep
          </h1>
          <p className="lead text-white">
            Order now and enjoy the best pizza in town!
          </p>
          <button className="btn btn-light btn-lg" onClick={() => setActiveTab("menu")}>
            Order Now
          </button>
        </div>
      </section>

      <div className="container my-4">
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          id="pizza-app-tabs"
          className="mb-3"
        >
          <Tab eventKey="menu" title="Menu">
            {/* Pizza Menu */}
            <section className="menu-section py-5" id="menu">
              <div className="container text-center">
                <h2 className="display-4">Pizza Menu</h2>
                <div className="row">
                  {pizzaData.map((pizza, index) => (
                    <div className="col-md-4" key={index}>
                      <div className="card pizza-card">
                        <img
                          src={pizza.image}
                          alt={pizza.name}
                          className="card-img-top"
                        />
                        <div className="card-body">
                          <h5 className="card-title">{pizza.name}</h5>
                          <p className="card-text">{pizza.description}</p>
                          <p className="text-primary">${pizza.price}</p>
                          <button
                            className="btn btn-primary"
                            onClick={() => addToCart(pizza)}
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </Tab>
          <Tab eventKey="cart" title={`Cart (${cart.length})`}>
            {/* Cart Section */}
            <section className="cart-section py-5 bg-light" id="cart">
              <div className="container text-center">
                <h2 className="display-4">Shopping Cart</h2>
                {cart.length === 0 ? (
                  <p>Your cart is empty. Add some delicious pizza! 🍕</p>
                ) : (
                  <ul className="list-group">
                    {cart.map((item, index) => (
                      <li className="list-group-item" key={index}>
                        <div className="item-info">
                          <span>
                            {item.name} x {item.quantity}
                          </span>
                          <span className="item-price">
                            ${item.price * item.quantity}
                          </span>
                        </div>
                        <div className="quantity-controls">
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => decreaseQuantity(item.name)}
                          >
                            -
                          </button>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => addToCart(item)}
                          >
                            +
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4">
                  <h3>Total Price: ${calculateTotalPrice()}</h3>
                </div>
                {cart.length > 0 && (
                  <button className="btn btn-success mt-4" onClick={handleCheckout}>
                    Checkout
                  </button>
                )}
              </div>
            </section>
          </Tab>
        </Tabs>
      </div>

      {/* Checkout Modal */}
      <Modal show={showCheckoutModal} onHide={handleCloseCheckoutModal}>
        <Modal.Header closeButton>
          <Modal.Title>Checkout</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={customerInfo.name}
                onChange={handleInputChange}
                placeholder="Enter your name"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={customerInfo.address}
                onChange={handleInputChange}
                placeholder="Enter your address"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={customerInfo.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                required
              />
            </Form.Group>
          </Form>
          <h4>Order Summary</h4>
          <ul>
            {cart.map((item, index) => (
              <li key={index}>
                {item.name} x {item.quantity} - ${item.price * item.quantity}
              </li>
            ))}
          </ul>
          <h5>Total: ${calculateTotalPrice()}</h5>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseCheckoutModal}>
            Close
          </Button>
          <Button variant="primary" onClick={submitOrder}>
            Place Order
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Login Modal */}
      <Modal show={showLoginModal} onHide={() => setShowLoginModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Login to View Orders</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={loginInfo.name}
                onChange={handleLoginChange}
                placeholder="Enter your name as in your orders"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={loginInfo.phone}
                onChange={handleLoginChange}
                placeholder="Enter your phone number used in orders"
                required
              />
            </Form.Group>
          </Form>
          <p className="text-center">
            Use the same name and phone number you used when placing orders.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLoginModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleLogin}>
            Login
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Orders Modal */}
      <Modal show={showOrdersModal} onHide={() => setShowOrdersModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>My Orders</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {orders.length === 0 ? (
            <p>You haven't placed any orders yet.</p>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{new Date(order.order_date).toLocaleString()}</td>
                      <td>
                        <ul>
                          {order.items.map((item, idx) => (
                            <li key={idx}>
                              {item.name} x {item.quantity} (${item.price})
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td>${order.total_price}</td>
                      <td>{order.status || "Processing"}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOrdersModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Admin Modal */}
      <Modal show={showAdminModal} onHide={() => setShowAdminModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Admin Dashboard - All Orders ({allOrders.length})</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {allOrders.length === 0 ? (
            <div className="alert alert-warning">
              <p>No orders found in database.</p>
              <button
                className="btn btn-sm btn-primary"
                onClick={fetchAllOrders}
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.customer_name}</td>
                      <td>{order.customer_phone}</td>
                      <td>{new Date(order.order_date).toLocaleString()}</td>
                      <td>${order.total_price}</td>
                      <td>
                        <Form.Select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        >
                          <option value="Processing">Processing</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Delivered">Delivered</option>
                        </Form.Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Footer */}
      <footer className="footer bg-dark text-white text-center py-4">
        <p>© 2025 PizzaOneFiveOne Shop. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

// Pizza data
const pizzaData = [
  {
    name: "Margherita Pizza",
    description: "A classic pizza with fresh mozzarella, basil, and tomato sauce.",
    image: MargheritaPizza,
    price: 9.99,
  },
  {
    name: "Pepperoni Pizza",
    description: "A delicious pizza topped with spicy pepperoni slices.",
    image: PepperoniPizza,
    price: 12.99,
  },
  {
    name: "Veggie Pizza",
    description: "A healthy pizza topped with fresh vegetables and cheese.",
    image: VeggiePizza,
    price: 10.99,
  },
  {
    name: "Hawaiian Pizza",
    description: "A tropical delight with ham, pineapple, and cheese.",
    image: HawaiianPizza,
    price: 11.99,
  },
  {
    name: "BBQ Chicken Pizza",
    description: "Smoky BBQ sauce, grilled chicken, and onions.",
    image: BBQChickenPizza,
    price: 13.99,
  },
  {
    name: "Meat Lovers Pizza",
    description: "Loaded with pepperoni, sausage, bacon, and ham.",
    image: MeatLoversPizza,
    price: 14.99,
  },
];

export default App;