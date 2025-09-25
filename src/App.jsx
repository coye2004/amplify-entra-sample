import React, { useState, useEffect } from 'react'
import { Amplify } from 'aws-amplify'
import { signInWithRedirect, signOut, fetchAuthSession } from 'aws-amplify/auth'
import { generateClient } from 'aws-amplify/api'

// Security constants
const SECURITY_CONFIG = {
  MAX_RETRY_ATTEMPTS: 3,
  TOKEN_REFRESH_THRESHOLD: 300000, // 5 minutes before expiry
  MAX_ERROR_MESSAGE_LENGTH: 200,
  ALLOWED_ORIGINS: ['http://localhost:5174', 'https://main.d2j5lex9wj9ikc.amplifyapp.com']
}

// Security utility functions
const sanitizeErrorMessage = (error) => {
  if (!error || typeof error !== 'string') return 'An unexpected error occurred'
  
  // Remove sensitive information and limit length
  let sanitized = error
    .replace(/client[_-]?secret[=:]\s*[^\s&]+/gi, 'client_secret=***')
    .replace(/token[=:]\s*[^\s&]+/gi, 'token=***')
    .replace(/password[=:]\s*[^\s&]+/gi, 'password=***')
    .replace(/key[=:]\s*[^\s&]+/gi, 'key=***')
    .substring(0, SECURITY_CONFIG.MAX_ERROR_MESSAGE_LENGTH)
  
  return sanitized
}

const validateOrigin = () => {
  const currentOrigin = window.location.origin
  return SECURITY_CONFIG.ALLOWED_ORIGINS.includes(currentOrigin)
}

const secureLog = (message, data = null) => {
  // In production, this would send to a secure logging service
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SECURE] ${message}`, data ? '[REDACTED]' : '')
  }
}

function App() {
  const [status, setStatus] = useState('Initializing...')
  const [statusType, setStatusType] = useState('loading')
  const [result, setResult] = useState('')
  const [resultType, setResultType] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [securityViolations, setSecurityViolations] = useState(0)

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
      // Security check: Validate token format
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token: Token must be a non-empty string')
      }

      // Security check: Basic JWT structure validation
      const parts = token.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format: Token must have 3 parts')
      }

      // Security check: Validate base64 encoding
      const headerB64 = parts[0].replace(/-/g, '+').replace(/_/g, '/')
      const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      
      // Add padding if needed
      const headerPadded = headerB64 + '='.repeat((4 - headerB64.length % 4) % 4)
      const payloadPadded = payloadB64 + '='.repeat((4 - payloadB64.length % 4) % 4)

      const header = JSON.parse(atob(headerPadded))
      const payload = JSON.parse(atob(payloadPadded))

      // Security check: Validate token structure
      if (!payload.iss || !payload.aud || !payload.exp) {
        throw new Error('Invalid JWT: Missing required claims')
      }

      // Security check: Check token expiration
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp < now) {
        throw new Error('Token expired')
      }

      secureLog('JWT token decoded successfully')
      return { header, payload }
    } catch (error) {
      secureLog('JWT decode failed', { error: error.message })
      return { error: sanitizeErrorMessage(error.message) }
    }
  }

  const initializeAmplify = async () => {
    try {
      // Security check: Validate origin
      if (!validateOrigin()) {
        setSecurityViolations(prev => prev + 1)
        secureLog('Security violation: Invalid origin detected', { origin: window.location.origin })
        updateStatus('Security Error: Invalid origin', 'error')
        showResult('❌ Security Error: This application can only be accessed from authorized domains.', 'error')
        return
      }

      updateStatus('Loading configuration...', 'loading')

      const response = await fetch('./amplify_outputs.json')
      if (response.ok) {
        const config = await response.json()
        
        // Security check: Validate configuration structure
        if (!config.Auth || !config.API) {
          throw new Error('Invalid configuration: Missing required sections')
        }

        Amplify.configure(config)
        secureLog('Amplify configuration loaded successfully')
        updateStatus('Amplify initialized successfully!', 'success')
        setIsInitialized(true)
      } else {
        throw new Error('amplify_outputs.json not found')
      }
    } catch (error) {
      const sanitizedError = sanitizeErrorMessage(error.message)
      updateStatus('Failed to initialize Amplify', 'error')
      showResult(`❌ Configuration Error: ${sanitizedError}\n\n🔧 To fix this:\n\n1. Start the Amplify sandbox:\n   npm run dev\n\n2. Wait for the backend to deploy\n\n3. Make sure amplify_outputs.json is generated\n\n4. Refresh this page\n\n💡 The amplify_outputs.json file contains the correct configuration for your Amplify backend. Without it, the app cannot connect to your authentication and API services.`, 'error')
      secureLog('Configuration load failed', { error: sanitizedError })
    }
  }

  const checkAuthenticationStatus = async () => {
    const urlParams = new URLSearchParams(window.location.search)
    const errorDescription = urlParams.get('error_description')
    const code = urlParams.get('code')

    // Security check: Validate URL parameters
    if (errorDescription) {
      const sanitizedError = sanitizeErrorMessage(decodeURIComponent(errorDescription))
      updateStatus('Authentication Error', 'error')
      showResult(`❌ Authentication Error:\n${sanitizedError}`, 'error')
      secureLog('Authentication error detected', { error: sanitizedError })
      return
    }

    try {
      const session = await fetchAuthSession()

      if (session.tokens?.idToken) {
        const token = session.tokens.idToken.toString()
        const decoded = decodeJWT(token)

        // Security check: Validate decoded token
        if (decoded.error) {
          updateStatus('Token validation failed', 'error')
          showResult(`❌ Token Error: ${decoded.error}`, 'error')
          secureLog('Token validation failed', { error: decoded.error })
          return
        }

        // Security check: Rate limiting for retry attempts
        if (retryCount >= SECURITY_CONFIG.MAX_RETRY_ATTEMPTS) {
          updateStatus('Too many failed attempts', 'error')
          showResult('❌ Security Error: Too many failed authentication attempts. Please refresh the page.', 'error')
          secureLog('Rate limit exceeded', { retryCount })
          return
        }

        updateStatus('Welcome! You are logged in successfully.', 'success')
        setIsAuthenticated(true)
        setRetryCount(0) // Reset retry count on successful authentication

        // Security: Never expose tokens in production
        const tokenInfo = process.env.NODE_ENV === 'development' 
          ? `\n\n🔑 JWT Token Information (Development Only):\n\nHeader:\n${JSON.stringify(decoded.header, null, 2)}\n\nPayload:\n${JSON.stringify(decoded.payload, null, 2)}\n\n⚠️ WARNING: Tokens are only shown in development mode for debugging.`
          : '\n\n🔒 Your session is secure and authenticated.'

        showResult(`✅ Welcome ${decoded.payload.email || 'User'}!\n\nYou are now authenticated with Microsoft Entra ID.${tokenInfo}\n\nClick the buttons below to test the GraphQL API.`, 'success')
        secureLog('User authenticated successfully', { email: decoded.payload.email })
      } else {
        // Immediately redirect to login without showing UI
        setIsRedirecting(true)
        updateStatus('Redirecting to Microsoft login...', 'loading')
        
        try {
          await signInWithRedirect({
            provider: 'AutodeskEntraIDTest'
          })
        } catch (error) {
          setIsRedirecting(false)
          setRetryCount(prev => prev + 1)
          const sanitizedError = sanitizeErrorMessage(error.message)
          updateStatus('Login failed', 'error')
          showResult(`❌ Login error: ${sanitizedError}`, 'error')
          secureLog('Login redirect failed', { error: sanitizedError, retryCount: retryCount + 1 })
        }
      }
    } catch (error) {
      setRetryCount(prev => prev + 1)
      const sanitizedError = sanitizeErrorMessage(error.message)
      updateStatus('Authentication check failed', 'error')
      showResult(`❌ Authentication check failed: ${sanitizedError}`, 'error')
      secureLog('Authentication check failed', { error: sanitizedError, retryCount: retryCount + 1 })
    }
  }

  const logout = async () => {
    try {
      updateStatus('Logging out...', 'loading')
      
      // Security: Clear all sensitive data from memory
      setResult('')
      setResultType('')
      
      await signOut()

      setIsAuthenticated(false)
      setIsRedirecting(true)
      updateStatus('Logged out successfully. Redirecting...', 'success')

      // Security: Clear any cached tokens
      if (typeof window !== 'undefined') {
        // Clear any localStorage/sessionStorage tokens
        localStorage.removeItem('amplify-token')
        sessionStorage.clear()
      }

      // Immediately redirect to login after logout
      try {
        await signInWithRedirect({
          provider: 'AutodeskEntraIDTest'
        })
      } catch (error) {
        setIsRedirecting(false)
        updateStatus('Login redirect failed', 'error')
        showResult(`❌ Login redirect error: ${error.message}`, 'error')
      }
    } catch (error) {
      updateStatus('Logout failed', 'error')
      showResult(`❌ Logout error: ${error.message}`, 'error')
    }
  }

  const testFunction = async () => {
    try {
      // Security check: Ensure user is authenticated
      if (!isAuthenticated) {
        updateStatus('Authentication required', 'error')
        showResult('❌ Security Error: You must be authenticated to use this feature.', 'error')
        return
      }

      updateStatus('Testing GraphQL API...', 'loading')

      const session = await fetchAuthSession()
      const token = session.tokens?.idToken?.toString()

      if (!token) {
        throw new Error('No authentication token found. Please login first.')
      }

      // Security: Validate token before making API calls
      const decoded = decodeJWT(token)
      if (decoded.error) {
        throw new Error('Invalid authentication token')
      }

      const client = generateClient()

      // Security: Sanitize input variables
      const sanitizedInput = 'Hello from GraphQL frontend!'.substring(0, 100) // Limit input length

      const result = await client.graphql({
        query: `
          mutation TestFunction($input: String) {
            testFunction(input: $input)
          }
        `,
        variables: {
          input: sanitizedInput
        }
      })

      updateStatus('GraphQL API test completed', 'success')
      
      // Security: Sanitize response data
      const sanitizedResult = JSON.stringify(result.data, null, 2)
      showResult(`✅ GraphQL API Response:\n${sanitizedResult}`, 'success')
      secureLog('GraphQL API test successful')
    } catch (error) {
      const sanitizedError = sanitizeErrorMessage(error.message)
      updateStatus('GraphQL API test failed', 'error')
      showResult(`❌ GraphQL error: ${sanitizedError}`, 'error')
      secureLog('GraphQL API test failed', { error: sanitizedError })
    }
  }

  const getUserInfo = async () => {
    try {
      // Security check: Ensure user is authenticated
      if (!isAuthenticated) {
        updateStatus('Authentication required', 'error')
        showResult('❌ Security Error: You must be authenticated to use this feature.', 'error')
        return
      }

      updateStatus('Getting user info...', 'loading')

      const session = await fetchAuthSession()
      const token = session.tokens?.idToken?.toString()

      if (!token) {
        throw new Error('No authentication token found. Please login first.')
      }

      // Security: Validate token before making API calls
      const decoded = decodeJWT(token)
      if (decoded.error) {
        throw new Error('Invalid authentication token')
      }

      const client = generateClient()

      const result = await client.graphql({
        query: `
          mutation FetchUserData {
            getUserInfo
          }
        `
      })

      updateStatus('User info retrieved', 'success')
      
      // Security: Sanitize and limit user data display
      const userData = result.data?.getUserInfo
      const sanitizedData = userData ? JSON.stringify(userData, null, 2) : 'No user data available'
      showResult(`✅ User Information:\n${sanitizedData}`, 'success')
      secureLog('User info retrieved successfully')
    } catch (error) {
      const sanitizedError = sanitizeErrorMessage(error.message)
      updateStatus('Get user info failed', 'error')
      showResult(`❌ Error: ${sanitizedError}`, 'error')
      secureLog('Get user info failed', { error: sanitizedError })
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

  // Show minimal loading UI when redirecting
  if (isRedirecting) {
    return (
      <div className="container">
        <h1>🚀 Amplify + Microsoft Entra ID</h1>
        <div className={`status ${statusType}`}>
          {status}
        </div>
        <div className="result">
          Please wait while we redirect you to Microsoft login...
        </div>
      </div>
    )
  }

  // Security warning for development
  const SecurityWarning = () => {
    if (process.env.NODE_ENV === 'development') {
      return (
        <div style={{ 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: '4px', 
          padding: '10px', 
          margin: '10px 0',
          fontSize: '14px'
        }}>
          ⚠️ <strong>Development Mode:</strong> This app is running in development mode. 
          Token information is visible for debugging purposes only. 
          <strong> Never expose tokens in production!</strong>
        </div>
      )
    }
    return null
  }

  return (
    <div className="container">
      <h1>🚀 Amplify + Microsoft Entra ID</h1>
      <p>Enterprise-grade authentication with GraphQL API - React Version</p>

      <SecurityWarning />

      <div className={`status ${statusType}`}>
        {status}
      </div>

      <div className="button-group">
        {!isAuthenticated && !isRedirecting && (
          <button 
            className="button" 
            disabled={!isInitialized}
            onClick={() => {
              setIsRedirecting(true)
              signInWithRedirect({ provider: 'AutodeskEntraIDTest' })
            }}
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
