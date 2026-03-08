"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Rider = {
  _id: string;
  name: string;
  rider_type: "captain" | "youth" | "climber" | "sprinter" | "one day rider" | "domestique";
  team_name: string;
  team_code: string;
  team_jersey: string;
};

const CATEGORIES: Rider["rider_type"][] = ["captain", "youth", "climber", "sprinter", "one day rider", "domestique"];

export default function MyTeamPage() {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [team, setTeam] = useState<(Rider | null)[]>([]);

  useEffect(() => {
    fetch("/api/my-team", { headers: { "x-user-id": "1" } })
      .then(res => res.json())
      .then(data => {
        if (data.team) {
          setTeamName(data.team.teamName || "My Team");
          setTeam(data.team.riders || []);
        }
      });
  }, []);

  const renderTeamList = (list: (Rider | null)[], title: string) => (
    <div className="mb-4" key={title}>
      <h3 className="text-lg font-bold mb-2">{title.charAt(0).toUpperCase() + title.slice(1)}</h3>
      {list.length === 0 && <span className="text-gray-400">No riders selected</span>}
      {list.map((r) => (
        <div key={r?._id || Math.random()} className="flex items-center border p-2 mb-2 rounded bg-gray-50">
          {r ? (
            <>
              <div className="w-12 h-12 flex items-center justify-center mr-2">
                <img
                  src={r.team_jersey.startsWith("/") ? r.team_jersey : "/" + r.team_jersey}
                  alt={r.team_code}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <span>{r.name} ({r.team_name})</span>
            </>
          ) : (
            <span className="text-gray-400">Empty Slot</span>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen p-4 bg-gray-100">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow">

        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{teamName || "My Team"}</h1>
          <Link href="/home">
            <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
              Home
            </button>
          </Link>
        </div>

        {CATEGORIES.map(type => renderTeamList(team.filter(r => r?.rider_type === type), type))}

        <button
          onClick={() => router.push("/edit-team")}
          className="mt-6 w-full bg-black text-white py-2 rounded-lg"
        >
          Edit Team
        </button>

      </div>
    </div>
  );
}