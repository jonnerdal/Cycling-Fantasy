// app/page.tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black p-8">
      <h1 className="text-3xl font-bold text-black dark:text-white">
        My Cycling Fantasy App
      </h1>
      <p className="mt-4 text-lg text-zinc-700 dark:text-zinc-300">
        Your API routes are live! Try:
      </p>
      <ul className="mt-2 text-blue-600">
        <li>
          <a href="/api/riders">/api/riders</a>
        </li>
        <li>
          <a href="/api/my-team">/api/my-team</a>
        </li>
      </ul>
    </main>
  );
}