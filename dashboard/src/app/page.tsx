"use client";

import { useState } from "react";
import { businesses, skills, getStats } from "@/data/workforce";
import type { Business, Team, Agent, AgentStatus, ProjectStatus } from "@/data/workforce";

function StatusDot({ status }: { status: AgentStatus | ProjectStatus }) {
  const colors: Record<string, string> = {
    active: "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]",
    scheduled: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]",
    idle: "bg-gray-500",
    error: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
    live: "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]",
    building: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]",
    planned: "bg-purple-500",
    paused: "bg-gray-600",
  };
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status] || "bg-gray-500"}`}
    />
  );
}

function StatusBadge({ status }: { status: AgentStatus | ProjectStatus }) {
  const styles: Record<string, string> = {
    active: "bg-green-500/10 text-green-400 border-green-500/20",
    scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    idle: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
    live: "bg-green-500/10 text-green-400 border-green-500/20",
    building: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    planned: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    paused: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${styles[status] || ""}`}
    >
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
      <div className="text-sm text-[var(--text-secondary)] mb-1">{label}</div>
      <div className="text-3xl font-bold text-[var(--text-primary)]">
        {value}
      </div>
      {sub && (
        <div className="text-xs text-[var(--text-muted)] mt-1">{sub}</div>
      )}
    </div>
  );
}

function AgentRow({ agent }: { agent: Agent }) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors">
      <StatusDot status={agent.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {agent.name}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {agent.role}
          </span>
        </div>
        <div className="text-xs text-[var(--text-secondary)] truncate">
          {agent.description}
        </div>
      </div>
      <div className="text-right shrink-0">
        <StatusBadge status={agent.status} />
        {agent.lastRun && (
          <div className="text-[10px] text-[var(--text-muted)] mt-1">
            Last: {agent.lastRun}
          </div>
        )}
      </div>
    </div>
  );
}

function TeamCard({ team }: { team: Team }) {
  const [expanded, setExpanded] = useState(false);
  const skill = skills.find((s) => s.id === team.skillId);
  const activeCount = team.agents.filter(
    (a) => a.status === "active" || a.status === "scheduled"
  ).length;

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left hover:bg-[var(--bg-card-hover)] transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusDot status={team.status} />
            <div>
              <div className="font-semibold text-[var(--text-primary)]">
                {team.name}
              </div>
              {skill && (
                <div className="text-xs text-amber-500 mt-0.5">
                  Skill: {skill.name}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-secondary)]">
              {activeCount}/{team.agents.length} agents active
            </span>
            <span
              className={`text-[var(--text-muted)] transition-transform ${expanded ? "rotate-180" : ""}`}
            >
              ▾
            </span>
          </div>
        </div>
      </button>
      {expanded && (
        <div className="border-t border-[var(--border)] p-3 space-y-0.5">
          {team.agents.map((agent) => (
            <AgentRow key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}

function BusinessSection({ business }: { business: Business }) {
  const totalAgents = business.teams.reduce(
    (sum, t) => sum + t.agents.length,
    0
  );
  const activeAgents = business.teams.reduce(
    (sum, t) =>
      sum +
      t.agents.filter((a) => a.status === "active" || a.status === "scheduled")
        .length,
    0
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusDot status={business.status} />
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {business.name}
            </h2>
            <div className="text-sm text-[var(--text-secondary)]">
              {business.description}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StatusBadge status={business.status} />
          {totalAgents > 0 && (
            <span className="text-sm text-[var(--text-muted)]">
              {activeAgents}/{totalAgents} agents
            </span>
          )}
          {business.website && (
            <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-1 rounded">
              {business.website}
            </span>
          )}
        </div>
      </div>

      {business.teams.length > 0 ? (
        <div className="grid gap-3 ml-5">
          {business.teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      ) : (
        <div className="ml-5 text-sm text-[var(--text-muted)] italic">
          No agent teams assigned yet
        </div>
      )}
    </div>
  );
}

function SkillCard({ skill }: { skill: (typeof skills)[0] }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-[var(--text-primary)]">
          {skill.name}
        </h3>
        {skill.configurable ? (
          <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">
            Ready
          </span>
        ) : (
          <span className="text-xs bg-gray-500/10 text-gray-500 border border-gray-500/20 px-2 py-0.5 rounded-full">
            Planned
          </span>
        )}
      </div>
      <p className="text-sm text-[var(--text-secondary)] mb-3">
        {skill.description}
      </p>
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>{skill.agentCount} agents in pipeline</span>
        <span>
          Deployed to {skill.deployedTo.length} business
          {skill.deployedTo.length !== 1 ? "es" : ""}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const stats = getStats();
  const [view, setView] = useState<"businesses" | "skills">("businesses");

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">
                Agent Command Center
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                REI Amplifi — AI Workforce Manager
              </p>
            </div>
            <div className="text-right text-sm text-[var(--text-muted)]">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Businesses"
            value={stats.totalBusinesses}
            sub={`${stats.liveBusinesses} live`}
          />
          <StatCard
            label="Agent Teams"
            value={stats.totalTeams}
            sub={`${stats.activeTeams} active`}
          />
          <StatCard
            label="Total Agents"
            value={stats.totalAgents}
            sub={`${stats.activeAgents} active`}
          />
          <StatCard
            label="Skills Library"
            value={stats.totalSkills}
            sub={`${stats.readySkills} ready to deploy`}
          />
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setView("businesses")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === "businesses"
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            Businesses & Teams
          </button>
          <button
            onClick={() => setView("skills")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === "skills"
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            Skills Library
          </button>
        </div>

        {/* Main Content */}
        {view === "businesses" ? (
          <div className="space-y-8">
            {businesses.map((business) => (
              <BusinessSection key={business.id} business={business} />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
