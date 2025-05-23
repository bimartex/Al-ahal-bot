import { useState } from 'react';

export default function Home() {
  const [lower, setLower] = useState('');
  const [upper, setUpper] = useState('');
  const [levels, setLevels] = useState('');
  const [message, setMessage] = useState('');

  const handleStart = async () => {
    const res = await fetch(`/api/bot?lower=${lower}&upper=${upper}&levels=${levels}`);
    const data = await res.json();
    setMessage(JSON.stringify(data));
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Bitget Grid Bot</h1>
      <input type="number" placeholder="Lower Bound" value={lower} onChange={e => setLower(e.target.value)} className="border p-2 mr-2" />
      <input type="number" placeholder="Upper Bound" value={upper} onChange={e => setUpper(e.target.value)} className="border p-2 mr-2" />
      <input type="number" placeholder="Grid Levels" value={levels} onChange={e => setLevels(e.target.value)} className="border p-2 mr-2" />
      <button onClick={handleStart} className="bg-blue-600 text-white px-4 py-2 rounded">Start Bot</button>
      {message && <pre className="mt-4 bg-gray-100 p-4">{message}</pre>}
    </div>
  );
}
