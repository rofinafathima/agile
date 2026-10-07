function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EPH-${timestamp}-${random}`;
}

function calculateDeliveryDate(days = 5) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function formatCurrency(amount) {
  return `₹${parseFloat(amount).toFixed(2)}`;
}

function paginate(query, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  return { limit, offset };
}

module.exports = { generateOrderNumber, calculateDeliveryDate, formatCurrency, paginate };
