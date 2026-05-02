const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    process.env.CLIENT_URL,
    'http://localhost:8081',   // Expo web
    'http://localhost:19006',  // Expo alternate
    'http://localhost:5173',   // fallback
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());

// Environment Variables
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// Import routes
const authRoutes = require('./routes/auth');
const expenseCategoryRoutes = require('./routes/expense_category_routes');
const incomeCategoryRoutes = require('./routes/income_category_routes');
const productCategoryRoutes = require('./routes/product_category_routes');
const serviceCategoryRoutes = require('./routes/service_category_routes');
const incomeListRoutes = require('./routes/income_routes');
const expenseListRoutes = require('./routes/expense_routes');
const toBuyRoutes = require('./routes/to_buy_routes');
const dashboardRoutes = require('./routes/dashboard');
const paymentCategoryRoutes = require('./routes/payment_category_routes');
const paymentAccountRoutes = require('./routes/payment_account_routes');
const paymentTransactionRoutes = require('./routes/payment_transaction_routes');

// Use routes
app.get('/', (req, res) => res.send('MyExpendo API is running ✅'));
app.use('/api/user', authRoutes);
app.use('/api/expenseCategory', expenseCategoryRoutes);
app.use('/api/incomeCategory', incomeCategoryRoutes);
app.use('/api/productCategory', productCategoryRoutes);
app.use('/api/serviceCategory', serviceCategoryRoutes);
app.use('/api/incomeList', incomeListRoutes);
app.use('/api/expenseList', expenseListRoutes);
app.use('/api/toBuyList', toBuyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/paymentCategory', paymentCategoryRoutes);
app.use('/api/paymentAccount', paymentAccountRoutes);
app.use('/api/paymentTransaction', paymentTransactionRoutes);

// Connect to MongoDB then start server
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Stop server if DB fails
  });