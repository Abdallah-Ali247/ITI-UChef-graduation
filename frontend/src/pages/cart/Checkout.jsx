import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createOrder } from "../../store/slices/orderSlice";

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, restaurantId, restaurantName, total } = useSelector(
    (state) => state.cart
  );
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { loading, error } = useSelector((state) => state.orders);

  const [formData, setFormData] = useState({
    delivery_address: "",
    delivery_notes: "",
    payment_method: "cash",
    total_price: total,
  });

  const { delivery_address, delivery_notes, payment_method } = formData;

  useEffect(() => {
    // Redirect if not authenticated or cart is empty
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (items.length === 0) {
      navigate("/cart");
      return;
    }

    // Pre-fill address if user has one
    if (user && user.address) {
      setFormData((prev) => ({
        ...prev,
        delivery_address: user.address,
      }));
    }

    // Update total price if cart changes
    setFormData((prev) => ({
      ...prev,
      total_price: total,
    }));
  }, [isAuthenticated, items, navigate, total, user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const orderData = {
      ...formData,
      restaurant: restaurantId,
    };

    const paymentData = {
      payment_method,
      amount: total,
    };

    dispatch(
      createOrder({
        orderData,
        cartItems: items,
        restaurantId,
        paymentData,
      })
    ).then((resultAction) => {
      if (createOrder.fulfilled.match(resultAction)) {
        const order = resultAction.payload;
        navigate(`/orders/${order.id}`);
      }
    });
  };

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>

      {error && (
        <div className="alert alert-danger">
          {typeof error === "object"
            ? Object.values(error).flat().join(", ")
            : error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "2rem",
          marginTop: "2rem",
        }}
      >
        <div className="checkout-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="delivery_address" className="form-label">
                Delivery Address
              </label>
              <textarea
                id="delivery_address"
                name="delivery_address"
                value={delivery_address}
                onChange={handleChange}
                className="form-control"
                rows="3"
                required
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="delivery_notes" className="form-label">
                Delivery Notes (Optional)
              </label>
              <textarea
                id="delivery_notes"
                name="delivery_notes"
                value={delivery_notes}
                onChange={handleChange}
                className="form-control"
                rows="2"
                placeholder="Any special delivery instructions?"
              ></textarea>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method</label>

              <div style={{ marginTop: "0.5rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem" }}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="cash"
                    checked={payment_method === "cash"}
                    onChange={handleChange}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Cash on Delivery
                </label>

                <label style={{ display: "block", marginBottom: "0.5rem" }}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="credit_card"
                    checked={payment_method === "credit_card"}
                    onChange={handleChange}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Credit Card
                </label>

                <label style={{ display: "block" }}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="wallet"
                    checked={payment_method === "wallet"}
                    onChange={handleChange}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Digital Wallet
                </label>
              </div>
            </div>

            {payment_method !== "cash" && (
              <div className="alert alert-info">
                Note: For this demo, no actual payment will be processed. In a
                production environment, this would connect to a payment gateway.
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "1.5rem" }}
              disabled={loading}
            >
              {loading ? "Processing..." : "Place Order"}
            </button>
          </form>
        </div>

        <div className="order-summary">
          <div className="card">
            <div className="card-body">
              <h2>Order Summary</h2>
              <p>From {restaurantName}</p>

              <div
                style={{
                  margin: "1.5rem 0",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "1rem",
                }}
              >
                {items.map((item) => (
                  <div
                    key={`${item.type}-${
                      item.id || item.customMealId
                    }-checkout`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: "bold",
                  fontSize: "1.2rem",
                }}
              >
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
