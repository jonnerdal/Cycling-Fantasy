"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";

type Rider = {
  _id: string;
  name: string;
  rider_type: "captain" | "youth" | "climber" | "sprinter" | "one day rider" | "domestique";
  team_name: string;
  team_code: string;
  team_jersey: string;
  price: number;
};

const TEAM_SIZE = 12;
const BUDGET = 100;
const MAX_TRANSFERS = 25;

const CATEGORY_REQUIREMENTS: Record<Rider["rider_type"], number> = {
  captain: 2,
  youth: 2,
  climber: 2,
  sprinter: 2,
  "one day rider": 2,
  domestique: 2,
};

const MAX_PER_TEAM = 3;
const LIST_MAX_HEIGHT = "h-60";

function round(num: number) {
  return Number(num.toFixed(2));
}

export default function EditTeamPage() {
  const router = useRouter();

  const [riders, setRiders] = useState<Rider[]>([]);
  const [team, setTeam] = useState<(Rider | null)[]>(Array(TEAM_SIZE).fill(null));
  const [originalTeam, setOriginalTeam] = useState<(Rider | null)[]>(Array(TEAM_SIZE).fill(null));

  const [teamName, setTeamName] = useState("");
  const [nameError, setNameError] = useState("");

  const [transfersRemaining, setTransfersRemaining] = useState(MAX_TRANSFERS);

  const [searchTerm, setSearchTerm] = useState("");
  const [teamFilter, setTeamFilter] = useState("");

  const CATEGORIES: Rider["rider_type"][] = [
    "captain",
    "youth",
    "climber",
    "sprinter",
    "one day rider",
    "domestique",
  ];

  useEffect(() => {
    fetch("/api/riders")
      .then(res => res.json())
      .then(data => setRiders(data.riders));

    fetch("/api/my-team")
      .then(res => res.json())
      .then(data => {
        if (data.team) {
          const savedTeam = data.team.riders || Array(TEAM_SIZE).fill(null);
          setTeamName(data.team.teamName || "");
          setTeam(savedTeam);
          setOriginalTeam(savedTeam);

          setTransfersRemaining(data.team.transfersRemaining ?? MAX_TRANSFERS);
        }
      });
  }, []);

  const uniqueTeams = [...new Set(riders.map(r => r.team_name))].sort();

  const currentBudget = round(team.reduce((sum, r) => sum + (r?.price || 0), 0));

  const countTeamRiders = (teamCode: string) =>
    team.filter(r => r?.team_code === teamCode).length;

  const countCategory = (type: Rider["rider_type"]) =>
    team.filter(r => r?.rider_type === type).length;

  function calculateTransfersNeeded() {
    let transfers = 0;
    for (let i = 0; i < TEAM_SIZE; i++) {
      if (originalTeam[i]?._id !== team[i]?._id) transfers++;
    }
    return transfers;
  }

  function getFilteredRiders(type: Rider["rider_type"]) {
    return riders
      .filter(r => r.rider_type === type)
      .filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(r => teamFilter === "" || r.team_name === teamFilter)
      .sort((a, b) => b.price - a.price); // sort by price descending
  }

  const handleAdd = (rider: Rider) => {
    if (team.some(r => r?._id === rider._id)) return;
    if (countTeamRiders(rider.team_code) >= MAX_PER_TEAM) return;
    if (countCategory(rider.rider_type) >= CATEGORY_REQUIREMENTS[rider.rider_type]) return;

    if (currentBudget + rider.price > BUDGET) {
      alert("Budget exceeded");
      return;
    }

    const transfersNeeded = calculateTransfersNeeded() + 1;
    if (transfersNeeded > MAX_TRANSFERS) {
      alert("Not enough transfers remaining");
      return;
    }

    const emptyIndex = team.findIndex(r => r === null);
    if (emptyIndex === -1) return;

    const newTeam = [...team];
    newTeam[emptyIndex] = rider;
    setTeam(newTeam);
  };

  const handleRemove = (idx: number) => {
    if (!team[idx]) return;

    const transfersNeeded = calculateTransfersNeeded() + 1;
    if (transfersNeeded > MAX_TRANSFERS) {
      alert("Not enough transfers remaining");
      return;
    }

    const newTeam = [...team];
    newTeam[idx] = null;
    setTeam(newTeam);
  };

  const handleSave = async () => {
    if (!teamName.trim()) {
      setNameError("Team name is required");
      return;
    }

    for (const type in CATEGORY_REQUIREMENTS) {
      if (countCategory(type as Rider["rider_type"]) !== CATEGORY_REQUIREMENTS[type as Rider["rider_type"]]) {
        alert(`You must select exactly ${CATEGORY_REQUIREMENTS[type as Rider["rider_type"]]} ${type}(s)`);
        return;
      }
    }

    if (currentBudget > BUDGET) {
      alert("Team exceeds budget");
      return;
    }

    const transfersNeeded = calculateTransfersNeeded();
    if (transfersNeeded > MAX_TRANSFERS) {
      alert("Not enough transfers remaining");
      return;
    }

    const res = await fetch("/api/my-team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamName,
        riders: team,
        transfersRemaining: MAX_TRANSFERS - transfersNeeded,
      }),
    });

    if (res.ok) router.push("/my-team");
    else alert("Error saving team");
  };

  const renderSelectedList = (type: Rider["rider_type"]) => {
    const requiredCount = CATEGORY_REQUIREMENTS[type];
    const list = team.filter(r => r?.rider_type === type);
    const paddedList = [...list];
    while (paddedList.length < requiredCount) paddedList.push(null);

    return (
      <div className="mb-4" key={type}>
        <h3 className="text-lg font-bold mb-2">{type.charAt(0).toUpperCase() + type.slice(1)}</h3>
        {paddedList.map((r, index) => (
          <div key={r?._id || index} className="flex items-center justify-between border p-2 mb-2 rounded bg-gray-50">
            {r ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <img src={r.team_jersey.startsWith("/") ? r.team_jersey : "/" + r.team_jersey} alt={r.team_code} className="max-w-full max-h-full object-contain"/>
                  </div>
                  <span>{r.name} ({r.team_name}) - ${r.price}</span>
                </div>
                <button onClick={() => handleRemove(team.indexOf(r))} className="ml-2 bg-red-500 text-white px-2 py-1 rounded">Remove</button>
              </>
            ) : <span className="text-gray-400">Empty Slot</span>}
          </div>
        ))}
      </div>
    );
  };

  const renderRiderList = (list: Rider[], type: Rider["rider_type"]) => (
    <div className="mb-4" key={`all-${type}`}>
      <h3 className="text-lg font-bold mb-2">{type.charAt(0).toUpperCase() + type.slice(1)}</h3>
      <div className={`overflow-y-auto border rounded p-2 ${LIST_MAX_HEIGHT}`}>
        {list.map(rider => {
          const isFullTeam = countTeamRiders(rider.team_code) >= MAX_PER_TEAM;
          const isMaxCategory = countCategory(rider.rider_type) >= CATEGORY_REQUIREMENTS[rider.rider_type];
          const isDisabled = isFullTeam || isMaxCategory || team.some(r => r?._id === rider._id) || currentBudget + rider.price > BUDGET;
          return (
            <div key={rider._id} className="flex justify-between items-center border-b py-2">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 flex items-center justify-center">
                  <img src={rider.team_jersey.startsWith("/") ? rider.team_jersey : "/" + rider.team_jersey} alt={rider.team_code} className="max-w-full max-h-full object-contain"/>
                </div>
                <span>{rider.name} ({rider.team_name}) - ${rider.price}</span>
              </div>
              <button onClick={() => handleAdd(rider)} disabled={isDisabled} className={`ml-2 px-2 py-1 rounded text-white ${isDisabled ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"}`}>+</button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 bg-gray-100">
      <div className="max-w-6xl mx-auto flex gap-8">

        {/* Left: Your Team */}
        <div className="flex-1 bg-white p-6 rounded-xl shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Your Team</h2>
            <div className="flex gap-2">
              <Link href="/home"><button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">Home</button></Link>
              <button onClick={() => signOut()} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Logout</button>
            </div>
          </div>

          <input type="text" value={teamName} onChange={e => { setTeamName(e.target.value); setNameError(""); }} placeholder="Team Name" className="w-full border px-2 py-1 rounded mb-2"/>
          {nameError && <p className="text-red-500 mb-2">{nameError}</p>}

          <div className="font-semibold mb-1">Budget: {currentBudget} / {BUDGET}</div>
          <div className="font-semibold mb-4">Transfers Remaining: {MAX_TRANSFERS - calculateTransfersNeeded()}</div>

          {CATEGORIES.map(type => renderSelectedList(type))}

          <button onClick={handleSave} className="mt-2 w-full bg-black text-white py-2 rounded-lg">Save Changes</button>
        </div>

        {/* Right: All Riders */}
        <div className="flex-1 bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">All Riders</h2>

          <div className="flex gap-2 mb-4">
            <input type="text" placeholder="Search rider..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="border rounded px-2 py-1 w-full"/>
            <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)} className="border rounded px-2 py-1">
              <option value="">All Teams</option>
              {uniqueTeams.map(team => <option key={team} value={team}>{team}</option>)}
            </select>
            <button onClick={() => { setSearchTerm(""); setTeamFilter(""); }} className="bg-gray-300 px-2 py-1 rounded">Reset</button>
          </div>

          {CATEGORIES.map(type => renderRiderList(getFilteredRiders(type), type))}
        </div>

      </div>
    </div>
  );
}