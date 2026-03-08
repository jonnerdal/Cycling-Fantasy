"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Team {
  _id: string;
  userId: string;
  teamName: string;
  riders: string[];
  points: number;
  username: string; // for leaderboard display
}

export default function HomePage() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);

  // Fetch leaderboard
  useEffect(() => {
    if (!session) return;

    fetch("/api/teams")
      .then(res => res.json())
      .then(data => setTeams(data.teams || []));
  }, [session]);

  if (status === "loading") return <p className="p-6">Loading...</p>;

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Welcome, {session.user?.name}</h1>
        <div>
          <button
            onClick={() => router.push("/my-team")}
            className="bg-black text-white px-4 py-1 rounded-lg hover:bg-gray-800 mr-2"
          >
            My Team
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="bg-red-600 text-white px-4 py-1 rounded-lg hover:bg-red-500"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Leaderboard</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="px-2 py-1">Rank</th>
              <th className="px-2 py-1">Username</th>
              <th className="px-2 py-1">Points</th>
            </tr>
          </thead>
          <tbody>
            {teams
              .sort((a, b) => b.points - a.points)
              .map((team, i) => (
                <tr key={team._id} className="border-t">
                  <td className="px-2 py-1">{i + 1}</td>
                  <td className="px-2 py-1">{team.username}</td>
                  <td className="px-2 py-1">{team.points}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
