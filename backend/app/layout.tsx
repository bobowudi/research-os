// Next.js App Router 根布局（仅 API 服务，无 UI）
export const metadata = { title: 'ResearchOS API' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
