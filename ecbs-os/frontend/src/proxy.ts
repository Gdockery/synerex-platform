import { NextRequest, NextResponse } from "next/server";

const selectedClientCookieName = "ecbs_selected_client_id";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const clientMatch = request.nextUrl.pathname.match(/^\/client-management\/clients\/(\d+)(?:\/|$)/);

  if (clientMatch?.[1]) {
    response.cookies.set(selectedClientCookieName, clientMatch[1], {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: ["/client-management/clients/:path*"],
};
