import axios from 'axios'

// Points to your local FastAPI backend during development.
// Change this to your deployed backend URL when you go to production.
const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
})

// Automatically attach the logged-in user's JWT token (if we have one) to
// every request, so the backend knows who's asking.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('devsphere_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// If the backend says our session is invalid/expired (401), clear the
// stored token so the app shows the login screen again instead of
// silently failing every request.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('devsphere_token')
    }
    return Promise.reject(error)
  }
)

export default apiClient