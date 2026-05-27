const getIndianISOTime = () => {
  return (
    new Date()
      .toLocaleString('sv-SE', {
        timeZone: 'Asia/Kolkata',
      })
      .replace(' ', 'T') + '+05:30'
  );
};

export const getHealth = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running with security measures enabled!',
    timestamp: getIndianISOTime(),
  });
};

export const notFound = (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl,
    timestamp: getIndianISOTime(),
  });
};