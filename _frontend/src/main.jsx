import React from 'react'
import ReactDOM from 'react-dom/client'
import { Providers } from './app/providers'
import { AppRouter } from './routes'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <Providers>
    <AppRouter />
  </Providers>
)
