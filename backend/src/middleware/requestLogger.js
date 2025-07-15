/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log the incoming request
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${req.ip}`);
  
  // Capture the original res.json function
  const originalJson = res.json;
  
  // Override res.json to log the response
  res.json = function(body) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Log the response
    console.log(`📤 ${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${statusCode} - ${duration}ms`);
    
    // Log error responses in more detail
    if (statusCode >= 400) {
      console.error(`❌ Error Response: ${JSON.stringify(body, null, 2)}`);
    }
    
    // Call the original res.json function
    originalJson.call(this, body);
  };
  
  next();
};

module.exports = {
  requestLogger
};
