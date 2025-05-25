module.exports = (req, res, next) => {
    // TODO: Replace this with real JWT validation later
    req.user = {
      id: "static-user-id", // Used for linking session and events
      role: "user"
    };
    next();
  };
  