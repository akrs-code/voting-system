export const checkHasVoted = (req, res, next) => {
  if (req.user.hasVoted) {
    return res.status(400).json({
      error: "User has already voted"
    });
  }

  next();
};