module.exports = (fn) => {
  return (req, res, next) => {
    // Promise.resolve ensures even non-async functions don't crash .catch()
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
