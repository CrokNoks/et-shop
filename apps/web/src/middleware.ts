import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "./shared/lib/supabase/middleware"; // Path relative to apps/web

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  return await updateSession(request, response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt, sitemap.xml, etc.
     * - icon, apple-icon, pwa-icon-192, pwa-icon-512, pwa-icon-monochrome
     *   (icones generees dynamiquement par app/icon.tsx, apple-icon.tsx et
     *   les route handlers pwa-icon-*). Un favicon ou une icone PWA ne doit
     *   jamais dependre d'une session : sans cette exclusion, une requete
     *   sans cookie de session valide (ex. avant toute connexion) recevait
     *   une redirection HTML vers /login au lieu du PNG attendu, et l'icone
     *   ne s'installait/ne s'affichait pas. manifest.webmanifest contient
     *   deja un point, exclu par la regle generique .*\..* ci-dessous.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|icon|apple-icon|pwa-icon-192|pwa-icon-512|pwa-icon-monochrome|.*\\..*).*)",
  ],
};
