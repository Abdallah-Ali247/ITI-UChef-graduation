# 🍽️ **UChef: Restaurant Ordering and Customization Platform**

UChef is a web-based platform that allows users to order predefined meals or customize their own meals by selecting ingredients. Restaurants can manage their menus, view orders, and streamline operations. The platform includes user authentication, cart management, payment integration, and an admin dashboard for monitoring system activity.

---

## 🌟 **Features**

### **For Users**
- **User Authentication:**
  - Register, log in, and manage profiles.
  - Role-based access (User, Restaurant, Admin).
- **Order Predefined Meals:**
  - Browse restaurant menus and add meals to the cart.
- **Customize Meals:**
  - Select ingredients and specify quantities to create custom meals.
- **Cart Management:**
  - View and manage items in the cart.
- **Payment Integration:**
  - Secure payment processing using Stripe.
- **Order Confirmation:**
  - Place orders and receive confirmation details.

### **For Restaurants**
- **Menu Management:**
  - Add, edit, and delete predefined meals and ingredients.
- **Order Tracking:**
  - View orders placed by users.

### **For Admins**
- **Admin Dashboard:**
  - Manage users, restaurants, and orders.
  - Monitor system activity and generate reports.

---

## 🛠️ **Tech Stack**

### **Backend**
- **Framework:** Django, Django REST Framework (DRF)
- **Database:** PostgreSQL
- **Authentication:** Token-based authentication
- **Payment Gateway:** Stripe

### **Frontend**
- **Framework:** React.js
- **State Management:** Redux (optional)
- **Routing:** React Router
- **Styling:** CSS or TailwindCSS (optional)
- **Payment Integration:** Stripe.js

### **Tools**
- **Version Control:** Git, GitHub
- **Deployment:** Docker (optional), AWS/Heroku (optional)

---

## 🚀 **Getting Started**

### **Prerequisites**
1. Python 3.12+
2. Node.js 18+
3. PostgreSQL database
4. Stripe account (for payment testing)

### **Installation**

#### **Backend Setup**
1. Clone the repository:
   ```bash
   git clone https://github.com/Abdallah-Ali247/uchef.git
   cd uchef/backend
   ```
2. Create a virtual environment:
   ```
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Set up environment variables:
   ```
   SECRET_KEY=your-django-secret-key
   DEBUG=True
   STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
   STRIPE_SECRET_KEY=your-stripe-secret-key
   DATABASE_URL=postgres://user:password@localhost:5432/uchef
    ```
5. Run migrations:
   ```
   python manage.py migrate
   ```
6. Start the backend server:
   ```
   python manage.py runserver
   ```
### **Frontend Setup**
1. Navigate to the frontend directory:
   ```
   cd ../frontend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the frontend development server:
   ```
   npm start
   ```

## i'm Happy that you Here :) 

