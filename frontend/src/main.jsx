import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HostScreen from './pages/HostScreen'
import PlayerScreen from './pages/PlayerScreen'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HostScreen />} />
        <Route path="/join/:roomId" element={<PlayerScreen />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)