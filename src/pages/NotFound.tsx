import { Link } from 'react-router'
import { useTitle } from '../lib/useTitle.ts'

export default function NotFound() {
  useTitle('Page not found')
  return (
    <main id="main" className="page">
      <h1>Page not found</h1>
      <p>
        <Link to="/">Back to home</Link>
      </p>
    </main>
  )
}
