import { io } from 'socket.io-client'

// Singleton — jeden socket dla całej aplikacji.
// W dev: Vite proxy przekierowuje /socket.io → port 3000
// W prod: łączy się z tym samym serwerem co strona
const socket = io()

export default socket
