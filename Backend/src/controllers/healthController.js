export const getHealth = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running with security measures enabled!',
    timestamp: new Date().toISOString(),
  });
};

export const handleLogin = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Login endpoint with strict rate limiting enabled',
    timestamp: new Date().toISOString(),
  });
};

export const notFound = (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl,
  });
};
