// app/record/page.tsx
'use client';

export default function RecordPage() {
  return (
    <div style={{ padding: '20px', background: 'purple', color: 'white', minHeight: '100vh' }}>
      <h1>🎙️ Page d'enregistrement</h1>
      <p>Test de navigation réussi !</p>
      <button onClick={() => window.history.back()}>Retour</button>
    </div>
  );
}