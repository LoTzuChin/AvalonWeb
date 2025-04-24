import React, { useEffect, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { io } from 'socket.io-client'

const socket = io('http://localhost:3001')

export default function HostScreen() {
  const [room, setRoom] = useState(null)
  const [players, setPlayers] = useState([])
  // 遊戲階段：lobby(未開始)、roleConfirmation(等待玩家確認角色)、announcement(所有玩家確認後，顯示公告)
  const [gamePhase, setGamePhase] = useState('lobby')

  useEffect(() => {
    socket.on('room-created', (roomData) => {
      setRoom(roomData)
    })

    socket.on('player-updated', (players) => {
      setPlayers(players)
    })

    socket.on('game-started', (players) => {
      setPlayers(players)
      setGamePhase('roleConfirmation')
    })

    socket.on('all-confirmed', () => {
      setGamePhase('announcement')
    })

    socket.on('error', (msg) => {
      alert(msg)
    })

    return () => {
      socket.off('room-created')
      socket.off('player-updated')
      socket.off('game-started')
      socket.off('all-confirmed')
      socket.off('error')
    }
  }, [])

  const createRoom = () => {
    const hostName = prompt('Enter your name as host:')
    if (hostName) socket.emit('create-room', hostName)
  }

  const startGame = () => {
    if (room) {
      socket.emit('start-game', room.id)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      {!room ? (
        <button onClick={createRoom}>Create Room</button>
      ) : (
        <div>
          <h1>Room ID: {room.id}</h1>
          {gamePhase === 'lobby' && (
            <>
              <QRCodeCanvas value={`http://localhost:5173/join/${room.id}`} />
              <h3>Players ({players.length}):</h3>
              <ul>
                {players.map(p => (
                  <li key={p.id}>
                    {p.name} {p.role ? `(${p.role})` : ''}
                  </li>
                ))}
              </ul>
              <button onClick={startGame} disabled={players.length < 5}>
                Start Game
              </button>
            </>
          )}
          {gamePhase === 'roleConfirmation' && (
            <>
              <h2>等待玩家確認角色...</h2>
              <ul>
                {players.map(p => (
                  <li key={p.id}>
                    {p.name} {p.confirmed ? '(已確認)' : '(等待中)'}
                  </li>
                ))}
              </ul>
            </>
          )}
          {gamePhase === 'announcement' && (
            <h2>所有人請閉眼、壞人請豎起大拇指....</h2>
          )}
        </div>
      )}
    </div>
  )
}
