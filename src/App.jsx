import React, { useState, useEffect } from 'react'
import { Amplify } from 'aws-amplify'
import { signInWithRedirect, signOut, fetchAuthSession } from 'aws-amplify/auth'
import { generateClient } from 'aws-amplify/api'

function App() {
  const [status, setStatus] = useState('Initializing Amplify...')
  const [statusType, setStatusType] = useState('loading')
  const [result, setResult] = useState('')
  const [resultType, setResultType] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const updateStatus = (message, type) => {
    setStatus(message)
    setStatusType(type)
  }

  const showResult = (message, type) => {
    setResult(message)
    setResultType(type)
  }

  const decodeJWT = (token) => {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format')
      }

      const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')))
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))

      return { header, payload }
    } catch (error) {
      return { error: error.message }
    }
  }

  const initializeAmplify = async () => {
    try {
      const response = await fetch('./amplify_outputs.json')
      if (response.ok) {
        const config = await response.json()
        Amplify.configure(config)
        updateStatus('Amplify initialized successfully!', 'success')
        setIsInitialized(true)
      } else {
        throw new Error('amplify_outputs.json not found')
      }
    } catch (error) {
      updateStatus('Failed to initialize Amplify', 'error')
      showResult(`❌ Configuration Error: ${error.message}\n\n🔧 To fix this:\n\n1. Start the Amplify sandbox:\n   npm run dev\n\n2. Wait for the backend to deploy\n\n3. Make sure amplify_outputs.json is generated\n\n4. Refresh this page\n\n💡 The amplify_outputs.json file contains the correct configuration for your Amplify backend. Without it, the app cannot connect to your authentication and API services.`, 'error')
    }
  }

  const checkAuthenticationStatus = async () => {
    const urlParams = new URLSearchParams(window.location.search)
    const errorDescription = urlParams.get('error_description')
    const code = urlParams.get('code')

    if (errorDescription) {
      showResult(`Authentication Error:\n${decodeURIComponent(errorDescription)}`, 'error')
      return
    }

    try {
      const session = await fetchAuthSession()

      if (session.tokens?.idToken) {
        const token = session.tokens.idToken.toString()
        const decoded = decodeJWT(token)

        updateStatus('Welcome! You are logged in successfully.', 'success')
        setIsAuthenticated(true)

        showResult(`✅ Welcome ${decoded.payload.email || 'User'}!\n\nYou are now authenticated with Microsoft Entra ID.\n\n🔑 JWT Token Information:\n\nHeader:\n${JSON.stringify(decoded.header, null, 2)}\n\nPayload:\n${JSON.stringify(decoded.payload, null, 2)}\n\n📝 Raw Token:\n${token}\n\nClick the buttons below to test the GraphQL API.`, 'success')
      } else {
        updateStatus('Redirecting to Microsoft login...', 'loading')
        showResult('Redirecting to Microsoft Entra ID for authentication...', 'info')

        setTimeout(async () => {
          try {
            await signInWithRedirect({
              provider: 'AutodeskEntraIDTest'
            })
          } catch (error) {
            updateStatus('Login failed', 'error')
            showResult(`Login error: ${error.message}`, 'error')
          }
        }, 1000)
      }
    } catch (error) {
      showResult(`Authentication check failed: ${error.message}`, 'error')
    }
  }

  const logout = async () => {
    try {
      updateStatus('Logging out...', 'loading')
      await signOut()

      updateStatus('Logged out successfully. Redirecting...', 'success')
      showResult('You have been logged out successfully. Redirecting to login...', 'success')
      setIsAuthenticated(false)

      setTimeout(async () => {
        try {
          await signInWithRedirect({
            provider: 'AutodeskEntraIDTest'
          })
        } catch (error) {
          updateStatus('Login redirect failed', 'error')
          showResult(`Login redirect error: ${error.message}`, 'error')
        }
      }, 2000)
    } catch (error) {
      updateStatus('Logout failed', 'error')
      showResult(`Logout error: ${error.message}`, 'error')
    }
  }

  const testFunction = async () => {
    try {
      updateStatus('Testing GraphQL API...', 'loading')

      const session = await fetchAuthSession()
      const token = session.tokens?.idToken?.toString()

      if (!token) {
        throw new Error('No authentication token found. Please login first.')
      }

      const client = generateClient()

      const result = await client.graphql({
        query: `
          mutation TestFunction($input: String) {
            testFunction(input: $input)
          }
        `,
        variables: {
          input: 'Hello from GraphQL frontend!'
        }
      })

      updateStatus('GraphQL API test completed', 'success')
      showResult(`✅ GraphQL API Response:\n${JSON.stringify(result.data, null, 2)}`, 'success')
    } catch (error) {
      updateStatus('GraphQL API test failed', 'error')
      showResult(`GraphQL error: ${error.message}`, 'error')
    }
  }

  const getUserInfo = async () => {
    try {
      updateStatus('Getting user info...', 'loading')

      const session = await fetchAuthSession()
      const token = session.tokens?.idToken?.toString()

      if (!token) {
        throw new Error('No authentication token found. Please login first.')
      }

      const client = generateClient()

      const result = await client.graphql({
        query: `
          mutation FetchUserData {  // ← Mutation name (can be anything)
            getUserInfo             // ← Field name (must match schema)
          }
        `
      })

      updateStatus('User info retrieved', 'success')
      showResult(`✅ User Information:\n${JSON.stringify(result.data, null, 2)}`, 'success')
    } catch (error) {
      updateStatus('Get user info failed', 'error')
      showResult(`Error: ${error.message}`, 'error')
    }
  }

  useEffect(() => {
    initializeAmplify()
  }, [])

  useEffect(() => {
    if (isInitialized) {
      setTimeout(() => {
        checkAuthenticationStatus()
      }, 1000)
    }
  }, [isInitialized])

  return (
    <div className="container">
      <h1>🚀 Amplify + Microsoft Entra ID</h1>
      <p>Enterprise-grade authentication with GraphQL API - React Version</p>

      <div className={`status ${statusType}`}>
        {status}
      </div>

      <div className="button-group">
        {!isAuthenticated && (
          <button 
            className="button" 
            disabled={!isInitialized}
            onClick={() => signInWithRedirect({ provider: 'AutodeskEntraIDTest' })}
          >
            Login with Microsoft
          </button>
        )}
        
        {isAuthenticated && (
          <>
            <button className="button" onClick={logout}>
              Logout
            </button>
            <button className="button" onClick={testFunction}>
              Test GraphQL API
            </button>
            <button className="button" onClick={getUserInfo}>
              Get User Info
            </button>
          </>
        )}
      </div>

      {result && (
        <div className={`result ${resultType}`}>
          {result}
        </div>
      )}
    </div>
  )
}

export default App
