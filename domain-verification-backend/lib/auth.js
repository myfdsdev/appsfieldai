// Bearer token verification middleware.
//
// The Base44 frontend calls POST /api/verify-custom-domain with a static shared
// secret: `Authorization: Bearer <VERIFICATION_SECRET>`. That secret is not a
// per-user JWT, so it does not by itself identify a user. To still support the
// ownership check (403), the caller may pass the acting user's id via the
// `userId` body field or an `X-User-Id` header; when present it is exposed as
// req.authUserId for the route to compare against marketplace.ownerId.

function requireBearer(req, res, next) {
  const secret = process.env.VERIFICATION_SECRET;
  if (!secret) {
    return res
      .status(500)
      .json({ error: "Server misconfigured: VERIFICATION_SECRET is not set." });
  }

  const header = req.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  const token = match ? match[1].trim() : null;

  if (!token || token !== secret) {
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization bearer token." });
  }

  // Optional acting-user id used for the ownership check downstream.
  req.authUserId =
    (req.body && req.body.userId) || req.get("x-user-id") || null;

  next();
}

module.exports = { requireBearer };
