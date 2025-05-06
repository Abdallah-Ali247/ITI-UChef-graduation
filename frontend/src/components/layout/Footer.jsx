import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3 className="footer-heading">UChef</h3>
          <p>
            Your personalized food ordering platform where you can customize meals
            exactly how you want them.
          </p>
        </div>
        
        <div className="footer-section">
          <h3 className="footer-heading">Quick Links</h3>
          <ul className="footer-links">
            <li className="footer-link">
              <Link to="/">Home</Link>
            </li>
            <li className="footer-link">
              <Link to="/restaurants">Restaurants</Link>
            </li>
            <li className="footer-link">
              <Link to="/cart">Cart</Link>
            </li>
            <li className="footer-link">
              <Link to="/orders">My Orders</Link>
            </li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3 className="footer-heading">Contact Us</h3>
          <ul className="footer-links">
            <li className="footer-link">Email: support@uchef.com</li>
            <li className="footer-link">Phone: +1 (555) 123-4567</li>
            <li className="footer-link">Address: 123 Food Street, Cuisine City</li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {currentYear} UChef. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
