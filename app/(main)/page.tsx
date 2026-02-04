import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to enter-code page
  redirect('/enter-code')
}
