import { useAuth } from '../context/AuthContext.jsx'

export default function Dashboard() {
  const { user, logout } = useAuth()

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 16 }}>
      <h2>Dashboard</h2>
      <p>Welcome{user?.name ? `, ${user.name}` : ''}.</p>
      <p>
        <strong>Roles:</strong> {user?.roles?.join(', ') || 'unknown'}
      </p>
      <button onClick={logout} style={{ padding: 10 }}>
        Logout
      </button>
    </div>
  )
}
