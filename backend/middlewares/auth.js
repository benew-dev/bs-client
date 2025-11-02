import { auth } from "@/lib/auth";
// import { getServerSession } from "next-auth";

const isAuthenticatedUser = async (req, res) => {
  // const session = await getServerSession(auth);
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session || !session.user) {
    return res.error("Login first to access this route", 401);
  }

  req.user = session.user;
};

export default isAuthenticatedUser;
