import ReactSVG from '@/assets/react.svg';
import { Badge } from '@/components/ui/badge';
import ChatBot from './pages/Chatbot';

function App() {
  return (
    <main className="flex flex-col items-center justify-center h-screen w-screen">
      <div className="flex flex-col items-center">
        <div className="inline-flex items-center">
        <ChatBot></ChatBot>
        </div>
      </div>
    </main>
  );
}

export default App;
