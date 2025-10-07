export default function Home() {
  return (
    <main style={{padding:24,fontFamily:"system-ui, sans-serif"}}>
      <h1>It works 🎉</h1>
      <p>Root route rendering (no middleware, no redirects).</p>
      <p><a href="/api/ok">Check /api/ok</a></p>
    </main>
  );
}
