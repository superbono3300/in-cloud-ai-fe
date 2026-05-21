import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ChatPage } from './views'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  )
}
