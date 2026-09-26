import { createRoot } from 'react-dom/client';
import App from './App';
import Editor from './Editor';
import { isBrowser } from './nui';
import './App.css';

// Stand-in for the game world when previewing the editor in a normal browser
if (isBrowser && location.search.includes('editor')) {
    document.body.style.background = 'linear-gradient(160deg, #5d7a8c, #2c3a42)';
}

createRoot(document.getElementById('root')).render(
    <>
        <App />
        <Editor />
    </>
);
