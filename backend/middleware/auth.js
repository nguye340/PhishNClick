

// Use JWTs (Cognito) to protect who can even access the API route 
// TODO: Still needs to validate and sanize all input whether form or URL (URL Injection) by insider/registered user
  const auth = (req, res, next) => {
    // TODO: Replace this with real JWT validation later
    req.user = {
      id: "static-user-id", // Used for linking session and events
      role: "user"
    };
    next();
  };
  
  export default auth;