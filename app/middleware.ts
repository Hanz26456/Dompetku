export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transaksi/:path*",
    "/hutang/:path*",
    "/laporan/:path*",
  ],
}