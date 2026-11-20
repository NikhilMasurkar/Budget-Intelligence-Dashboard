import { useApp } from './hooks/useApp'
import AppLayout from './components/App/AppLayout'

export default function App() {
  return <AppLayout app={useApp()} />
}
