import { useState } from 'react';
import { X } from 'lucide-react';
import SearchTab from './SearchTab.jsx';
import ScanTab from './ScanTab.jsx';
import AITab from './AITab.jsx';

export default function LogSheet({ defaultMeal, onClose, onLogged }) {
  const [tab, setTab] = useState('search');

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h2>Log food</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '0 16px 12px' }}>
          <div className="segmented">
            <button className={tab === 'search' ? 'active' : ''} onClick={() => setTab('search')}>Search</button>
            <button className={tab === 'scan' ? 'active' : ''} onClick={() => setTab('scan')}>Scan</button>
            <button className={tab === 'ai' ? 'active' : ''} onClick={() => setTab('ai')}>AI</button>
          </div>
        </div>
        <div className="sheet-body">
          {tab === 'search' && <SearchTab defaultMeal={defaultMeal} onLogged={onLogged} />}
          {tab === 'scan' && <ScanTab defaultMeal={defaultMeal} onLogged={onLogged} />}
          {tab === 'ai' && <AITab defaultMeal={defaultMeal} onLogged={onLogged} />}
        </div>
      </div>
    </div>
  );
}
