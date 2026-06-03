const errorHandler = (err, req, res, _next) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} — ${err.message}`);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
};

const notFound = (req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
};

module.exports = { errorHandler, notFound };
