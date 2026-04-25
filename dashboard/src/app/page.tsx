"use client";

import { useState } from "react";
import {
  businesses,
  skills,
  roles,
  teamTemplates,
  teamInstances,
  executives,
  getStats,
  getRoleById,
  getTemplateById,
  getInstancesForBusiness,
  getDirectReports,
  getHealthAlerts,
} from "@/data/workforce";
import type {
  Role,
  TeamTemplate,
  TeamInstance,
  Business,
  Executive,
  AgentStatus,
  ProjectStatus,
  ExecLevel,
  HealthAlert,
  AlertLevel,
} from "@/data/workforce";

// ─── SHARED COMPONENTS ─────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]",
    scheduled: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]",
    idle: "bg-gray-500",
    error: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
    live: "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]",
    building: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]",
    planned: "bg-purple-500",
    paused: "bg-gray-600",
    "not-running": "bg-red-400",
  };
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${colors[status] || "bg-gray-500"}`}
    />
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-500/10 text-green-400 border-green-500/20",
    scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    idle: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
    live: "bg-green-500/10 text-green-400 border-green-500/20",
    building: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    planned: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    paused: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    "not-running": "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${styles[status] || ""}`}
    >
      {status === "not-running" ? "not running" : status}
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
      <div className="text-sm text-[var(--text-secondary)] mb-1">{label}</div>
      <div className="text-3xl font-bold text-[var(--text-primary)]">{value}</div>
      {sub && <div className="text-xs text-[var(--text-muted)] mt-1">{sub}</div>}
    </div>
  );
}

// ─── ROLE DETAIL PANEL (slide-out) ─────────────────────────────

function RoleDetailPanel({ role, onClose }: { role: Role; onClose: () => void }) {
  const usedIn = teamTemplates.filter((t) => t.roleIds.includes(role.id));
  const deployedInstances = teamInstances.filter((ti) =>
    usedIn.some((t) => t.id === ti.templateId)
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[var(--bg-secondary)] border-l border-[var(--border)] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--border)] p-6 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{role.name}</h2>
              <div className="text-sm text-[var(--text-secondary)] mt-0.5">{role.title}</div>
            </div>
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-2xl p-1">&times;</button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{role.description}</p>

          {role.duties.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-3">Duties & Responsibilities</h3>
              <ul className="space-y-2">
                {role.duties.map((duty, i) => (
                  <li key={i} className="flex gap-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                    <span className="text-amber-500 shrink-0 mt-0.5">&#x2022;</span>
                    {duty}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-3">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
              <div className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold mb-2">Inputs</div>
              <p className="text-sm text-[var(--text-secondary)]">{role.inputs}</p>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
              <div className="text-[10px] uppercase tracking-wider text-green-400 font-semibold mb-2">Outputs</div>
              <p className="text-sm text-[var(--text-secondary)]">{role.outputs}</p>
            </div>
          </div>

          {role.selfHealing && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
              <div className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold mb-2">Self-Healing</div>
              <p className="text-sm text-[var(--text-secondary)]">{role.selfHealing}</p>
            </div>
          )}

          {role.tools && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-2">Tools</h3>
              <div className="flex flex-wrap gap-2">
                {role.tools.map((tool, i) => (
                  <span key={i} className="text-xs bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] px-3 py-1.5 rounded-full">{tool}</span>
                ))}
              </div>
            </div>
          )}

          {role.cost && (
            <div className="text-sm text-[var(--text-muted)]">
              Cost: <span className="text-[var(--text-secondary)]">{role.cost}</span>
            </div>
          )}

          {usedIn.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-2">Used in Team Templates</h3>
              <div className="space-y-1">
                {usedIn.map((t) => (
                  <div key={t.id} className="text-sm text-amber-400">{t.name}</div>
                ))}
              </div>
            </div>
          )}

          {deployedInstances.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-2">Deployed to</h3>
              <div className="space-y-1">
                {deployedInstances.map((ti) => {
                  const biz = businesses.find((b) => b.id === ti.businessId);
                  return (
                    <div key={ti.id} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <StatusDot status={ti.status} />
                      {biz?.name || ti.businessId}
                      {ti.schedule && <span className="text-[var(--text-muted)]">— {ti.schedule}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ORG CHART VIEW ────────────────────────────────────────────

function OrgExecCard({
  exec,
  onSelectRole,
}: {
  exec: Executive;
  onSelectRole: (role: Role) => void;
}) {
  const [expanded, setExpanded] = useState(exec.level === "ceo");
  const reports = getDirectReports(exec.id);

  // Find businesses this exec directs
  const managedBusinesses = businesses.filter((b) => b.directorId === exec.id);
  const managedInstances = managedBusinesses.flatMap((b) =>
    getInstancesForBusiness(b.id)
  );

  // Rollup stats
  const totalRoles = managedInstances.reduce((sum, ti) => {
    const t = getTemplateById(ti.templateId);
    return sum + (t ? t.roleIds.length : 0);
  }, 0);
  const activeRoles = managedInstances
    .filter((ti) => ti.status === "active" || ti.status === "scheduled")
    .reduce((sum, ti) => {
      const t = getTemplateById(ti.templateId);
      return sum + (t ? t.roleIds.length : 0);
    }, 0);

  // For VPs, aggregate from their directors
  const vpReportBusinesses =
    exec.level === "vp"
      ? reports.flatMap((dir) => businesses.filter((b) => b.directorId === dir.id))
      : [];
  const vpInstances = vpReportBusinesses.flatMap((b) =>
    getInstancesForBusiness(b.id)
  );
  const vpTotalRoles = vpInstances.reduce((sum, ti) => {
    const t = getTemplateById(ti.templateId);
    return sum + (t ? t.roleIds.length : 0);
  }, 0);
  const vpActiveRoles = vpInstances
    .filter((ti) => ti.status === "active" || ti.status === "scheduled")
    .reduce((sum, ti) => {
      const t = getTemplateById(ti.templateId);
      return sum + (t ? t.roleIds.length : 0);
    }, 0);

  const displayTotal = exec.level === "vp" ? vpTotalRoles : totalRoles;
  const displayActive = exec.level === "vp" ? vpActiveRoles : activeRoles;

  const levelColors: Record<ExecLevel, string> = {
    ceo: "border-amber-500/30 bg-amber-500/5",
    vp: "border-purple-500/30 bg-purple-500/5",
    director: "border-[var(--border)] bg-[var(--bg-card)]",
  };

  const titleColors: Record<ExecLevel, string> = {
    ceo: "text-amber-400",
    vp: "text-purple-400",
    director: "text-[var(--text-secondary)]",
  };

  return (
    <div className={`border rounded-xl overflow-hidden ${levelColors[exec.level]}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                exec.level === "ceo"
                  ? "bg-amber-500/20 text-amber-400"
                  : exec.level === "vp"
                    ? "bg-purple-500/20 text-purple-400"
                    : "bg-blue-500/20 text-blue-400"
              }`}
            >
              {exec.level === "ceo" ? "CEO" : exec.name.split(" ").pop()?.[0] || "?"}
            </div>
            <div>
              <div className="font-semibold text-[var(--text-primary)]">{exec.name}</div>
              <div className={`text-xs ${titleColors[exec.level]}`}>{exec.title}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {displayTotal > 0 && (
              <span className="text-sm text-[var(--text-secondary)]">
                {displayActive}/{displayTotal} agents
              </span>
            )}
            {reports.length > 0 && (
              <span className="text-xs text-[var(--text-muted)]">
                {reports.length} report{reports.length !== 1 ? "s" : ""}
              </span>
            )}
            <span className={`text-[var(--text-muted)] transition-transform ${expanded ? "rotate-180" : ""}`}>
              ▾
            </span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)]">
          {/* Responsibilities */}
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-2">
              Responsibilities
            </div>
            <ul className="space-y-1">
              {exec.responsibilities.map((r, i) => (
                <li key={i} className="flex gap-2 text-xs text-[var(--text-secondary)]">
                  <span className="text-amber-500 shrink-0">&#x2022;</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* Managed businesses with their team instances */}
          {managedBusinesses.length > 0 && (
            <div className="px-4 py-3 border-b border-[var(--border)]">
              {managedBusinesses.map((biz) => {
                const instances = getInstancesForBusiness(biz.id);
                return (
                  <div key={biz.id} className="mb-3 last:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusDot status={biz.status} />
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{biz.name}</span>
                      <StatusBadge status={biz.status} />
                    </div>
                    {instances.length > 0 ? (
                      <div className="ml-4 space-y-2">
                        {instances.map((ti) => {
                          const template = getTemplateById(ti.templateId);
                          if (!template) return null;
                          return (
                            <TeamInstanceRow
                              key={ti.id}
                              instance={ti}
                              template={template}
                              onSelectRole={onSelectRole}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="ml-4 text-xs text-[var(--text-muted)] italic">
                        No agent teams deployed
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Direct reports (recursive) */}
          {reports.length > 0 && (
            <div className="p-4 space-y-3">
              {reports.map((r) => (
                <OrgExecCard key={r.id} exec={r} onSelectRole={onSelectRole} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TeamInstanceRow({
  instance,
  template,
  onSelectRole,
}: {
  instance: TeamInstance;
  template: TeamTemplate;
  onSelectRole: (role: Role) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const skill = skills.find((s) => s.id === template.skillId);
  // Deduplicate role IDs for display (fact-checker appears twice in SEO team)
  const uniqueRoleIds = [...new Set(template.roleIds)];
  const roleCount = template.roleIds.length;

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2.5 text-left hover:bg-[var(--bg-card-hover)] transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusDot status={instance.status} />
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">{template.name}</div>
              <div className="text-[10px] text-[var(--text-muted)]">
                {instance.runsOn}
                {instance.schedule && <> — {instance.schedule}</>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {skill && <span className="text-[10px] text-amber-500">{skill.name}</span>}
            <span className="text-xs text-[var(--text-muted)]">{roleCount} roles</span>
            <span className={`text-[var(--text-muted)] transition-transform text-xs ${expanded ? "rotate-180" : ""}`}>▾</span>
          </div>
        </div>
      </button>
      {expanded && (
        <div className="border-t border-[var(--border)] p-2 space-y-0.5">
          {template.roleIds.map((roleId, idx) => {
            const role = getRoleById(roleId);
            if (!role) return null;
            return (
              <button
                key={`${roleId}-${idx}`}
                onClick={() => onSelectRole(role)}
                className="w-full flex items-center gap-2 py-1.5 px-2 rounded hover:bg-[var(--bg-card-hover)] transition-colors text-left"
              >
                <span className="text-xs text-amber-500 font-mono w-4 text-right shrink-0">{idx + 1}</span>
                <span className="text-sm text-[var(--text-primary)]">{role.name}</span>
                <span className="text-xs text-[var(--text-muted)]">{role.title}</span>
                <span className="ml-auto text-[var(--text-muted)] text-sm">&#x203A;</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── BUSINESSES VIEW ───────────────────────────────────────────

function BusinessCard({
  business,
  onSelectRole,
}: {
  business: Business;
  onSelectRole: (role: Role) => void;
}) {
  const instances = getInstancesForBusiness(business.id);
  const director = executives.find((e) => e.id === business.directorId);
  const vp = director ? executives.find((e) => e.id === director.reportsTo) : null;
  const totalRoles = instances.reduce((sum, ti) => {
    const t = getTemplateById(ti.templateId);
    return sum + (t ? t.roleIds.length : 0);
  }, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusDot status={business.status} />
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{business.name}</h2>
            <div className="text-sm text-[var(--text-secondary)]">{business.description}</div>
            {director && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-blue-400">{director.title}</span>
                {vp && <span className="text-xs text-[var(--text-muted)]">reports to {vp.title}</span>}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StatusBadge status={business.status} />
          {totalRoles > 0 && (
            <span className="text-sm text-[var(--text-muted)]">{totalRoles} agents</span>
          )}
          {business.website && (
            <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-1 rounded">{business.website}</span>
          )}
        </div>
      </div>

      {instances.length > 0 ? (
        <div className="grid gap-3 ml-5">
          {instances.map((ti) => {
            const template = getTemplateById(ti.templateId);
            if (!template) return null;
            return (
              <TeamInstanceRow key={ti.id} instance={ti} template={template} onSelectRole={onSelectRole} />
            );
          })}
        </div>
      ) : (
        <div className="ml-5 text-sm text-[var(--text-muted)] italic">No agent teams deployed</div>
      )}
    </div>
  );
}

// ─── SKILLS & ROLES VIEW ───────────────────────────────────────

function SkillCard({ skill }: { skill: (typeof skills)[0] }) {
  const templates = teamTemplates.filter((t) => t.skillId === skill.id);
  const instances = teamInstances.filter((ti) =>
    templates.some((t) => t.id === ti.templateId)
  );
  const bizIds = [...new Set(instances.map((ti) => ti.businessId))];

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-[var(--text-primary)]">{skill.name}</h3>
        {skill.configurable ? (
          <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">Ready</span>
        ) : (
          <span className="text-xs bg-gray-500/10 text-gray-500 border border-gray-500/20 px-2 py-0.5 rounded-full">Planned</span>
        )}
      </div>
      <p className="text-sm text-[var(--text-secondary)] mb-3">{skill.description}</p>
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>{templates.length} team template{templates.length !== 1 ? "s" : ""}</span>
        <span>Deployed to {bizIds.length} business{bizIds.length !== 1 ? "es" : ""}</span>
      </div>
    </div>
  );
}

function RoleCatalogCard({ role, onSelect }: { role: Role; onSelect: (r: Role) => void }) {
  const usedIn = teamTemplates.filter((t) => t.roleIds.includes(role.id));
  const deployCount = teamInstances.filter((ti) =>
    usedIn.some((t) => t.id === ti.templateId)
  ).length;

  return (
    <button
      onClick={() => onSelect(role)}
      className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 text-left hover:bg-[var(--bg-card-hover)] transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-[var(--text-primary)]">{role.name}</h3>
        <span className="text-[var(--text-muted)] text-sm">&#x203A;</span>
      </div>
      <div className="text-xs text-amber-500 mb-2">{role.title}</div>
      <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">{role.description}</p>
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>{usedIn.length} team{usedIn.length !== 1 ? "s" : ""}</span>
        <span>{deployCount} deployment{deployCount !== 1 ? "s" : ""}</span>
      </div>
    </button>
  );
}

// ─── HEALTH VIEW ───────────────────────────────────────────────

function AlertIcon({ level }: { level: AlertLevel }) {
  const icons: Record<AlertLevel, string> = {
    critical: "!!",
    warning: "!",
    info: "i",
    success: "OK",
  };
  const styles: Record<AlertLevel, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    success: "bg-green-500/20 text-green-400 border-green-500/30",
  };
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border shrink-0 ${styles[level]}`}>
      {icons[level]}
    </span>
  );
}

function HealthAlertCard({ alert }: { alert: HealthAlert }) {
  const borderStyles: Record<AlertLevel, string> = {
    critical: "border-red-500/30 bg-red-500/5",
    warning: "border-amber-500/30 bg-amber-500/5",
    info: "border-[var(--border)] bg-[var(--bg-card)]",
    success: "border-green-500/20 bg-green-500/5",
  };

  return (
    <div className={`border rounded-xl p-4 ${borderStyles[alert.level]}`}>
      <div className="flex gap-3">
        <AlertIcon level={alert.level} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[var(--text-primary)] mb-0.5">{alert.title}</div>
          <div className="text-sm text-[var(--text-secondary)] mb-2">{alert.description}</div>
          <div className="text-xs text-amber-400">
            Action: {alert.action}
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthView() {
  const alerts = getHealthAlerts();
  const critical = alerts.filter((a) => a.level === "critical");
  const warnings = alerts.filter((a) => a.level === "warning");
  const info = alerts.filter((a) => a.level === "info");
  const healthy = alerts.filter((a) => a.level === "success");

  return (
    <div className="space-y-8">
      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`rounded-xl p-4 border ${critical.length > 0 ? "border-red-500/30 bg-red-500/10" : "border-[var(--border)] bg-[var(--bg-card)]"}`}>
          <div className="text-3xl font-bold text-red-400">{critical.length}</div>
          <div className="text-sm text-[var(--text-secondary)]">Critical</div>
        </div>
        <div className={`rounded-xl p-4 border ${warnings.length > 0 ? "border-amber-500/30 bg-amber-500/10" : "border-[var(--border)] bg-[var(--bg-card)]"}`}>
          <div className="text-3xl font-bold text-amber-400">{warnings.length}</div>
          <div className="text-sm text-[var(--text-secondary)]">Warnings</div>
        </div>
        <div className="rounded-xl p-4 border border-[var(--border)] bg-[var(--bg-card)]">
          <div className="text-3xl font-bold text-blue-400">{info.length}</div>
          <div className="text-sm text-[var(--text-secondary)]">Info</div>
        </div>
        <div className="rounded-xl p-4 border border-green-500/20 bg-green-500/5">
          <div className="text-3xl font-bold text-green-400">{healthy.length}</div>
          <div className="text-sm text-[var(--text-secondary)]">Healthy</div>
        </div>
      </div>

      {/* Needs Attention */}
      {(critical.length > 0 || warnings.length > 0) && (
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Needs Attention</h2>
          <div className="space-y-3">
            {critical.map((a) => <HealthAlertCard key={a.id} alert={a} />)}
            {warnings.map((a) => <HealthAlertCard key={a.id} alert={a} />)}
          </div>
        </div>
      )}

      {/* Info */}
      {info.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Opportunities</h2>
          <div className="space-y-3">
            {info.map((a) => <HealthAlertCard key={a.id} alert={a} />)}
          </div>
        </div>
      )}

      {/* Running Healthy */}
      {healthy.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Running Healthy</h2>
          <div className="space-y-3">
            {healthy.map((a) => <HealthAlertCard key={a.id} alert={a} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN DASHBOARD ────────────────────────────────────────────

export default function Dashboard() {
  const stats = getStats();
  const [view, setView] = useState<"health" | "org" | "businesses" | "skills">("health");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const ceo = executives.find((e) => e.level === "ceo")!;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">Agent Command Center</h1>
              <p className="text-sm text-[var(--text-secondary)]">REI Amplifi — AI Workforce Manager</p>
            </div>
            <div className="text-right text-sm text-[var(--text-muted)]">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Businesses" value={stats.totalBusinesses} sub={`${stats.liveBusinesses} live`} />
          <StatCard label="Executives" value={stats.totalExecutives} sub={`${stats.vps} VPs, ${stats.directors} Directors`} />
          <StatCard label="Team Deployments" value={stats.totalTeamInstances} sub={`${stats.activeTeamInstances} active`} />
          <StatCard label="Deployed Agents" value={stats.totalDeployedRoles} sub={`${stats.activeDeployedRoles} active`} />
          <StatCard label="Skills Library" value={stats.totalSkills} sub={`${stats.totalRoleTemplates} unique roles`} />
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          {(["health", "org", "businesses", "skills"] as const).map((v) => {
            const labels: Record<string, string> = {
              health: "Health",
              org: "Org Chart",
              businesses: "Businesses",
              skills: "Skills & Roles",
            };
            const alertCount = v === "health" ? getHealthAlerts().filter((a) => a.level === "critical" || a.level === "warning").length : 0;
            return (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  view === v
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                {labels[v]}
                {alertCount > 0 && (
                  <span className="bg-red-500/20 text-red-400 text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        {view === "health" && <HealthView />}

        {view === "org" && (
          <div className="space-y-4">
            <OrgExecCard exec={ceo} onSelectRole={setSelectedRole} />
          </div>
        )}

        {view === "businesses" && (
          <div className="space-y-8">
            {businesses.map((b) => (
              <BusinessCard key={b.id} business={b} onSelectRole={setSelectedRole} />
            ))}
          </div>
        )}

        {view === "skills" && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Skills</h2>
                <a
                  href="/skills"
                  className="text-sm font-medium text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
                >
                  View all 18 skills with deployments + triggers →
                </a>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {skills.map((s) => (
                  <SkillCard key={s.id} skill={s} />
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Role Catalog ({roles.length} roles)</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {roles.map((r) => (
                  <RoleCatalogCard key={r.id} role={r} onSelect={setSelectedRole} />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {selectedRole && (
        <RoleDetailPanel role={selectedRole} onClose={() => setSelectedRole(null)} />
      )}
    </div>
  );
}
