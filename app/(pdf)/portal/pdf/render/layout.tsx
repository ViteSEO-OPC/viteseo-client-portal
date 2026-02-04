// Minimal layout for PDF render - bypasses main app providers
// The page.tsx renders the PDF content only

export default function PdfRenderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Just pass through children - the page renders its own HTML
  return <>{children}</>
}
