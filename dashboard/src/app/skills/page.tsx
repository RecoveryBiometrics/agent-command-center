"use client";

import { useState, useMemo } from "react";
import { generatedSkills, skillsLastGenerated, type GeneratedSkill } from "@/data/generated-skills";
import { RefreshCw, ChevronRight, Clock, Server, GitBranch, AlertCircle, CheckCircle2, MinusCircle } from "lucide-react";

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-500",
    scheduled: "bg-blue-500",
    idle: "bg-gray-400",
    error: "bg-red-500",
    unknown: "bg-gray-300",
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status] || "bg-gray-300"}`} />;
}

function RunsOnBadge({ runsOn }: { runsOn: string }) {
  const lower = runsOn.toLowerCase();
  let icon = <Server className="w-3 h-3" />;
  let cls = "bg-gray-100 text-gray-700 border-gray-200";
  if (lower.includes("github") || lower.includes("actions")) {
    icon = <GitBranch className="w-3 h-3" />;
    cls = "bg-purple-50 text-purple-700 border-purple-200";
  } else if (lower.includes("vps") || lower.includes("ionos")) {
    icon = <Server className="w-3 h-3" />;
    cls = "bg-blue-50 text-blue-700 border-blue-200";
  } else if (lower.includes("manual") || lower === "unknown") {
    icon = <MinusCircle className="w-3 h-3" />;
    cls = "bg-amber-50 text-amber-700 border-amber-200";
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${cls}`}>
      {icon}
      {runsOn}
    </span>
  );
}

function HealthIcon({ deployments }: { deployments: GeneratedSkill["deployments"] }) {
  if (deployments.length === 0) {
    return (
      <span title="Not deployed to any business" className="text-gray-300">
        <MinusCircle className="w-4 h-4" />
      </span>
    );
  }
  const hasActive = deployments.some((d) => d.status === "active" || d.status === "scheduled");
  const hasError = deployments.some((d) => d.status === "error");
  if (hasError) return <span title="Has errors"><AlertCircle className="w-4 h-4 text-red-500" /></span>;
  if (hasActive) return <span title="Deployed and running"><CheckCircle2 className="w-4 h-4 text-green-500" /></span>;
  return <span title="Deployed but idle"><Clock className="w-4 h-4 text-gray-400" /></span>;
}

export default function SkillsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterRunsOn, setFilterRunsOn] = useState<string>("all");
  const [filterDeployed, setFilterDeployed] = useState<"all" | "deployed" | "undeployed">("all");

  const stats = useMemo(() => {
    const total = generatedSkills.length;
    const deployed = generatedSkills.filter((s) => s.deployments.length > 0).length;
    const totalDeploys = generatedSkills.reduce((acc, s) => acc + s.deployments.length, 0);
    const activeCron = generatedSkills.reduce(
      (acc, s) => acc + s.deployments.filter((d) => !!d.cron || /\d/.test(d.schedule)).length,
      0,
    );
    return { total, deployed, totalDeploys, activeCron };
  }, [refreshKey]);

  const filtered = useMemo(() => {
    return generatedSkills.filter((s) => {
      if (filterDeployed === "deployed" && s.deployments.length === 0) return false;
      if (filterDeployed === "undeployed" && s.deployments.length > 0) return false;
      if (filterRunsOn !== "all") {
        const has = s.deployments.some((d) => d.runs_on.toLowerCase().includes(filterRunsOn.toLowerCase()));
        if (!has && s.deployments.length > 0) return false;
        if (s.deployments.length === 0) return false;
      }
      return true;
    });
  }, [refreshKey, filterRunsOn, filterDeployed]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        <header className="mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold">Skills</h1>
              <p className="text-sm text-gray-600 mt-1">
                Every reusable skill in <code className="bg-gray-100 px-1 rounded text-xs">~/.claude/skills/</code>, with where it&rsquo;s deployed and what triggers it.
              </p>
            </div>
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-sm font-medium shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Last generated: {new Date(skillsLastGenerated).toLocaleString()}
          </p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Total skills</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{stats.deployed}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Deployed</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold">{stats.totalDeploys}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Total instances</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.activeCron}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">On cron schedule</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Filter:</div>
          <select
            value={filterDeployed}
            onChange={(e) => setFilterDeployed(e.target.value as "all" | "deployed" | "undeployed")}
            className="text-sm bg-white border border-gray-200 rounded px-2 py-1"
          >
            <option value="all">All skills</option>
            <option value="deployed">Deployed only</option>
            <option value="undeployed">Undeployed only</option>
          </select>
          <select
            value={filterRunsOn}
            onChange={(e) => setFilterRunsOn(e.target.value)}
            className="text-sm bg-white border border-gray-200 rounded px-2 py-1"
          >
            <option value="all">All runtimes</option>
            <option value="github">GitHub Actions</option>
            <option value="vps">IONOS VPS</option>
            <option value="manual">Manual</option>
          </select>
          <span className="text-xs text-gray-500 ml-auto">
            Showing {filtered.length} of {generatedSkills.length}
          </span>
        </div>

        {/* Skills table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wide">
            <div className="col-span-1"></div>
            <div className="col-span-3">Skill</div>
            <div className="col-span-5">Description</div>
            <div className="col-span-2">Deployments</div>
            <div className="col-span-1 text-right">Details</div>
          </div>
          {filtered.map((s) => (
            <div key={s.id} className="border-b border-gray-100 last:border-0">
              <button
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                className="w-full grid grid-cols-12 px-4 py-3 hover:bg-gray-50 text-left items-center"
              >
                <div className="col-span-1 flex items-center">
                  <HealthIcon deployments={s.deployments} />
                </div>
                <div className="col-span-3">
                  <div className="font-medium text-sm">{s.name}</div>
                  <code className="text-xs text-gray-500">{s.invocation}</code>
                </div>
                <div className="col-span-5 text-sm text-gray-600 line-clamp-2">
                  {s.description}
                </div>
                <div className="col-span-2 text-sm">
                  {s.deployments.length === 0 ? (
                    <span className="text-gray-400 text-xs">none</span>
                  ) : (
                    <span className="text-gray-700">
                      {s.deployments.length} business{s.deployments.length === 1 ? "" : "es"}
                    </span>
                  )}
                </div>
                <div className="col-span-1 flex justify-end">
                  <ChevronRight
                    className={`w-4 h-4 text-gray-400 transition-transform ${expanded === s.id ? "rotate-90" : ""}`}
                  />
                </div>
              </button>

              {expanded === s.id && (
                <div className="px-4 pb-4 pt-1 bg-gray-50 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Triggers */}
                    <div>
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                        Triggers ({s.triggers.length})
                      </div>
                      {s.triggers.length === 0 ? (
                        <p className="text-xs text-gray-400">No triggers defined</p>
                      ) : (
                        <ul className="space-y-1">
                          {s.triggers.map((t, i) => (
                            <li key={i} className="text-xs">
                              <code className="bg-white border border-gray-200 rounded px-1.5 py-0.5">{t}</code>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Deployments */}
                    <div>
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                        Deployments ({s.deployments.length})
                      </div>
                      {s.deployments.length === 0 ? (
                        <p className="text-xs text-gray-400">Not deployed to any business yet</p>
                      ) : (
                        <ul className="space-y-2">
                          {s.deployments.map((d, i) => (
                            <li key={i} className="bg-white border border-gray-200 rounded p-2">
                              <div className="flex items-center gap-2 mb-1">
                                <StatusDot status={d.status} />
                                <span className="text-sm font-medium">{d.business_name}</span>
                                <span className="text-xs text-gray-400">({d.business_id})</span>
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                <RunsOnBadge runsOn={d.runs_on} />
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {d.schedule}
                                </span>
                                {d.cron && <code className="bg-gray-100 px-1 rounded">{d.cron}</code>}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Allowed tools */}
                  {s.allowed_tools.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                        Allowed tools
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {s.allowed_tools.map((t, i) => (
                          <code
                            key={i}
                            className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5"
                          >
                            {t}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Note about live data */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <strong>Live run status not wired yet.</strong> This page shows static config from{" "}
              <code className="bg-white px-1 rounded">skills/*/SKILL.md</code> + business YAMLs. To
              show actual last-run timestamps and pass/fail status, next iteration adds an{" "}
              <code className="bg-white px-1 rounded">/api/skills/status</code> route that polls
              GitHub Actions API + ops_log JSON. Refresh button currently re-renders cached data —
              it will fetch live status once that route exists.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
