import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { io } from 'socket.io-client'

const socket = io('http://localhost:3001')

export default function PlayerScreen() {
  const { roomId } = useParams()
  const [role, setRole] = useState('')
  const [name, setName] = useState('')
  // 是否按下 OK 鍵完成角色確認
  const [hasConfirmed, setHasConfirmed] = useState(false)
  // 是否所有玩家均已確認
  const [allConfirmed, setAllConfirmed] = useState(false)
  const hasPrompted = useRef(false)

  useEffect(() => {
    if (!hasPrompted.current) {
      hasPrompted.current = true
      const playerName = prompt('Enter your name:')
      setName(playerName)
      
      socket.emit('join-room', { 
        roomId, 
        playerName: playerName || 'Anonymous'
      })
    }

    socket.on('role-assigned', (assignedRole) => {
      setRole(assignedRole)
    })

    socket.on('all-confirmed', () => {
      setAllConfirmed(true)
    })

    socket.on('error', (errorMsg) => {
      alert(errorMsg)
    })

    return () => {
      socket.off('role-assigned')
      socket.off('all-confirmed')
      socket.off('error')
    }
  }, [roomId])

  const confirmRole = () => {
    console.log('發出 confirm-role 事件, roomId:', roomId);
    socket.emit('confirm-role', roomId);
    setHasConfirmed(true);
  }  
  

  // 邏輯流程：
  // 1. 尚未分配角色：等待遊戲開始
  if (!role) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Welcome {name}!</h1>
        <p>等待主持人開始遊戲...</p>
      </div>
    )
  }

  // 2. 分配到角色，但尚未按 OK：顯示角色資訊與確認按鈕
  if (role && !hasConfirmed) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Welcome {name}!</h1>
        <h2>Your Role: {role}</h2>
        <p>請按下 OK 確認你已閱讀你的角色</p>
        <button onClick={confirmRole}>OK</button>
      </div>
    )
  }

  // 3. 按下 OK 後畫面變黑，等待所有玩家確認
  if (hasConfirmed && !allConfirmed) {
    return (
      <div style={{ backgroundColor: 'black', height: '100vh', width: '100vw' }}></div>
    )
  }

  // 4. 當所有玩家確認後，顯示提示訊息
  if (allConfirmed) {
    return (
      <div style={{ padding: 20 }}>
        <h1>請伸起大拇指，並閉起雙眼</h1>
      </div>
    )
  }

  return null;
}
