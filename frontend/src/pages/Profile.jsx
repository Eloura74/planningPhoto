import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usersAPI } from '../services/api'

function Profile() {
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const response = await usersAPI.getMe()
      setUserData(response.data)
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Mon Profil</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/calendar')}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Calendrier
            </button>
            <button
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">Informations personnelles</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Nom</label>
              <p className="text-gray-900">{userData?.name}</p>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Email</label>
              <p className="text-gray-900">{userData?.email}</p>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Téléphone</label>
              <p className="text-gray-900">{userData?.phone || 'Non renseigné'}</p>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Rôle</label>
              <p className="text-gray-900">
                {userData?.role === 'ADMIN' ? 'Administrateur' : 'Élève'}
              </p>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Membre du groupe</label>
              <p className="text-gray-900">
                {userData?.is_group_member ? 'Oui' : 'Non'}
              </p>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Membre depuis</label>
              <p className="text-gray-900">
                {userData?.created_at ? new Date(userData.created_at).toLocaleDateString('fr-FR') : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
