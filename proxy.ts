import { auth } from "@/lib/auth/server";

// Every route requires a signed-in user except the ones listed in
// `publicRoutes`. /api/auth and the /auth/* sign-in views are public by default.
// Add each public showcase page (e.g. "/features", "/pricing") here.
export default auth.middleware({
  loginUrl: "/auth/sign-in",
  publicRoutes: ["/"],
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
