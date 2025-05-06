# UChef - Your Personal Chef Marketplace

UChef is a comprehensive meal preparation and delivery platform that connects users with talented chefs. The application allows users to browse meals, place orders, and have them prepared by professional chefs.

## Project Overview

UChef is a full-stack application built with:
- **Frontend**: React 19 with Vite
- **Backend**: Django 5.2 with Django REST Framework
- **Database**: SQLite (development)
- **Payment Processing**: Stripe

## Features

- **User Authentication**: Register, login, and profile management
- **Meal Browsing**: Browse meals with filtering by category, price, and availability
- **Restaurant Management**: Chefs can create and manage their restaurant profiles
- **Order System**: Place, track, and manage orders
- **Reviews and Ratings**: Leave reviews and ratings for meals
- **Notifications**: Real-time notifications for order updates
- **Payment Integration**: Secure payment processing with Stripe

## Project Structure

```
ITI-UChef/
├── backend/                 # Django backend
│   ├── meals/               # Meals app
│   ├── notifications/       # Notifications app
│   ├── orders/              # Orders app
│   ├── restaurants/         # Restaurants app
│   ├── reviews/             # Reviews app
│   ├── uchef_project/       # Main Django project
│   ├── users/               # Users app
│   ├── media/               # Media files
│   ├── manage.py            # Django management script
│   └── .env                 # Environment variables
├── frontend/                # React frontend
│   ├── public/              # Public assets
│   ├── src/                 # Source code
│   │   ├── assets/          # Static assets
│   │   ├── components/      # Reusable components
│   │   ├── context/         # React context
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── store/           # Redux store
│   │   ├── styles/          # CSS styles
│   │   └── utils/           # Utility functions
│   ├── index.html           # HTML entry point
│   └── package.json         # NPM dependencies
└── requirements.txt         # Python dependencies
```

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   Create a `.env` file in the backend directory with the following variables:
   ```
   SECRET_KEY=your_secret_key
   DEBUG=True
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

4. Run migrations:
   ```
   cd backend
   python manage.py migrate
   ```

5. Create initial categories (optional):
   ```
   python create_categories.py
   ```

6. Start the backend server:
   ```
   python manage.py runserver
   ```

### Frontend Setup

1. Install dependencies:
   ```
   cd frontend
   npm install
   ```

2. Create a `.env` file in the frontend directory:
   ```
   VITE_API_URL=http://localhost:8000
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/users/register/` - Register a new user
- `POST /api/users/login/` - Login
- `GET /api/users/profile/` - Get user profile

### Meals
- `GET /api/meals/meals/` - List all meals
- `GET /api/meals/meals/{id}/` - Get meal details
- `GET /api/meals/categories/` - List meal categories
- `GET /api/meals/meals/{id}/check_availability/` - Check meal ingredient availability

### Orders
- `POST /api/orders/create/` - Create a new order
- `GET /api/orders/` - List user orders
- `GET /api/orders/{id}/` - Get order details

### Restaurants
- `GET /api/restaurants/` - List restaurants
- `GET /api/restaurants/{id}/` - Get restaurant details

### Reviews
- `POST /api/reviews/create/` - Create a review
- `GET /api/reviews/meal/{meal_id}/` - Get reviews for a meal

## Technologies Used

### Backend
- Django 5.2
- Django REST Framework 3.16
- Python 3.8+
- SQLite (development)
- Pillow (image processing)
- Python Decouple (environment variables)
- Stripe (payment processing)

### Frontend
- React 19
- Redux Toolkit
- React Router 7
- Axios
- Bootstrap 5
- React Bootstrap
- React Icons
- React Toastify
- Stripe JS
- Vite 6

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgements

- [React](https://reactjs.org/)
- [Django](https://www.djangoproject.com/)
- [Bootstrap](https://getbootstrap.com/)
- [Stripe](https://stripe.com/)
