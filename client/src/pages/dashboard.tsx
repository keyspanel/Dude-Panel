import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useSiteName } from "@/hooks/use-site-name";
import { Link } from "wouter";
import {
  Key, Users, Shield, Wallet, Clock, Gamepad2, Link2,
  AlertTriangle, Ban, UserCheck, UserPlus, Settings,
  ArrowRight, Plus, Eye, User,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/currency";

function useSessionCountdown(expiresAt: number | null) {
  const [remaining, setRemaining] = useState<string | null>(null);

  useEffect(() => {
    if (!expiresAt) { setRemaining(null); return; }

    function compute() {
      const diff = expiresAt - Date.now();
      if (diff <= 0) { setRemaining(null); return; }
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      setRemaining(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
    }

    compute();
    const interval = setInterval(compute, 30000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return remaining;
}

function InfoRow({ label, value, testId }: { label: string; value: React.ReactNode; testId: string }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-border/40 last:border-0 gap-3" data-testid={testId}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground text-right">{value}</span>
    </div>
  );
}

function formatIST(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? "";
  const dd = get("day").replace(/^0/, "");
  const mm = get("month").replace(/^0/, "");
  const yyyy = get("year");
  const hh = get("hour");
  const mi = get("minute");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi} IST`;
}

function formatExpiryCountdown(date: Date): { label: string; tone: "ok" | "warn" | "crit" | "expired" } {
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return { label: "Expired", tone: "expired" };
  const days = Math.ceil(diffMs / 86400000);
  const tone: "ok" | "warn" | "crit" = days <= 1 ? "crit" : days < 7 ? "warn" : "ok";
  const label = days === 1 ? "1 day left" : `${days} days left`;
  return { label, tone };
}

function StatCard({ title, value, icon: Icon, color, testId }: {
  title: string; value: string | number; icon: any; color: string; testId: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-4 shadow-sm" data-testid={testId}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <div className={`w-8 h-8 rounded flex items-center justify-center ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-2xl font-bold tracking-tight font-mono">{value}</div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, testId }: {
  href: string; icon: any; label: string; testId: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded border border-border/60 bg-card shadow-sm active:bg-muted/60"
      data-testid={testId}
    >
      <div className="w-8 h-8 rounded flex items-center justify-center bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm font-medium flex-1">{label}</span>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="bg-panel-header px-5 py-3 flex items-center gap-2">
      <Icon className="h-4 w-4 text-panel-header-foreground/70" />
      <h2 className="text-sm font-semibold text-panel-header-foreground">{title}</h2>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { siteName } = useSiteName();
  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  const sessionRemaining = useSessionCountdown(stats?.sessionExpiresAt);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const level = stats?.level ?? user?.level ?? 3;
  const levelName = stats?.levelName ?? "User";
  const username = stats?.username ?? user?.username ?? "";
  const displayName = stats?.fullname || username;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="bg-panel-header px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-panel-header-foreground/10 flex items-center justify-center">
              <span className="text-lg font-bold text-panel-header-foreground">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold text-panel-header-foreground truncate" data-testid="text-welcome">
                Welcome, {displayName}
              </h1>
              <p className="text-xs text-panel-header-foreground/50 mt-0.5" data-testid="text-welcome-sub">
                {siteName || "Dashboard"}
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-semibold bg-panel-header-foreground/10 text-panel-header-foreground border border-panel-header-foreground/10" data-testid="text-role-badge">
              {levelName}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <SectionHeader icon={Shield} title="Account Information" />
        <div>
          <InfoRow label="Role" value={levelName} testId="info-role" />
          <InfoRow label="Balance" value={formatCurrency(stats?.saldo ?? 0)} testId="info-balance" />
          {sessionRemaining && (
            <InfoRow label="Session Expires" value={`in ${sessionRemaining}`} testId="info-session" />
          )}
          {stats?.createdAt && (
            <InfoRow
              label="Member Since"
              value={formatIST(new Date(stats.createdAt))}
              testId="info-member-since"
            />
          )}
          {stats?.expirationDate && level !== 1 && (() => {
            const expDate = new Date(stats.expirationDate);
            const { label, tone } = formatExpiryCountdown(expDate);
            const toneClass =
              tone === "crit" || tone === "expired"
                ? "bg-red-500/15 text-red-500 border-red-500/30"
                : tone === "warn"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
            return (
              <InfoRow
                label="Panel Expires"
                value={
                  <span className="inline-flex items-center gap-2 flex-wrap justify-end">
                    <span className="font-mono">{formatIST(expDate)}</span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${toneClass}`} data-testid="badge-expiry-countdown">
                      {label}
                    </span>
                  </span>
                }
                testId="info-panel-expires"
              />
            );
          })()}
        </div>
      </div>

      {level === 1 && <OwnerStats stats={stats} />}
      {level === 2 && <AdminStats stats={stats} />}
      {level === 3 && <ResellerStats stats={stats} />}

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <SectionHeader icon={ArrowRight} title="Quick Actions" />
        <div className="p-4 space-y-2">
          {level === 1 && (
            <>
              <QuickAction href="/keys/generate" icon={Plus} label="Generate Key" testId="action-generate-key" />
              <QuickAction href="/users" icon={Users} label="Manage Users" testId="action-manage-users" />
              <QuickAction href="/games" icon={Gamepad2} label="Manage Games" testId="action-manage-games" />
              <QuickAction href="/settings" icon={Settings} label="Settings" testId="action-settings" />
            </>
          )}
          {level === 2 && (
            <>
              <QuickAction href="/keys/generate" icon={Plus} label="Generate Key" testId="action-generate-key" />
              <QuickAction href="/referrals" icon={Link2} label="Create Referral" testId="action-referrals" />
              <QuickAction href="/users" icon={Users} label="Manage Users" testId="action-manage-users" />
              <QuickAction href="/keys" icon={Eye} label="View Keys" testId="action-view-keys" />
            </>
          )}
          {level === 3 && (
            <>
              <QuickAction href="/keys/generate" icon={Plus} label="Generate Key" testId="action-generate-key" />
              <QuickAction href="/keys" icon={Eye} label="View Keys" testId="action-view-keys" />
              <QuickAction href="/profile" icon={User} label="My Profile" testId="action-profile" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function OwnerStats({ stats }: { stats: any }) {
  return (
    <>
      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <SectionHeader icon={Key} title="Key Statistics" />
        <div className="p-4 grid gap-3 grid-cols-1 sm:grid-cols-2">
          <StatCard title="Total Keys" value={stats?.totalKeys ?? 0} icon={Key} color="bg-amber-500/10 text-amber-500 dark:text-amber-400" testId="card-total-keys" />
          <StatCard title="Active Keys" value={stats?.activeKeys ?? 0} icon={Shield} color="bg-emerald-500/10 text-emerald-500 dark:text-emerald-400" testId="card-active-keys" />
          <StatCard title="Expired Keys" value={stats?.expiredKeys ?? 0} icon={Clock} color="bg-red-500/10 text-red-500 dark:text-red-400" testId="card-expired-keys" />
          <StatCard title="Blocked Keys" value={stats?.blockedKeys ?? 0} icon={Ban} color="bg-orange-500/10 text-orange-500 dark:text-orange-400" testId="card-blocked-keys" />
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <SectionHeader icon={Users} title="User Statistics" />
        <div className="p-4 grid gap-3 grid-cols-1 sm:grid-cols-2">
          <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={Users} color="bg-violet-500/10 text-violet-500 dark:text-violet-400" testId="card-total-users" />
          <StatCard title="Pending" value={stats?.pendingUsers ?? 0} icon={AlertTriangle} color="bg-orange-500/10 text-orange-500 dark:text-orange-400" testId="card-pending-users" />
          <StatCard title="Admins" value={stats?.totalAdmins ?? 0} icon={UserCheck} color="bg-blue-500/10 text-blue-500 dark:text-blue-400" testId="card-total-admins" />
          <StatCard title="Resellers" value={stats?.totalResellers ?? 0} icon={UserPlus} color="bg-cyan-500/10 text-cyan-500 dark:text-cyan-400" testId="card-total-resellers" />
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <SectionHeader icon={Gamepad2} title="System Overview" />
        <div>
          <InfoRow label="Total Games" value={stats?.totalGames ?? 0} testId="info-total-games" />
          <InfoRow label="Total Referrals" value={stats?.totalReferrals ?? 0} testId="info-total-referrals" />
        </div>
      </div>
    </>
  );
}

function AdminStats({ stats }: { stats: any }) {
  return (
    <>
      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <SectionHeader icon={Key} title="Key Statistics" />
        <div className="p-4 grid gap-3 grid-cols-1 sm:grid-cols-2">
          <StatCard title="Total Keys" value={stats?.totalKeys ?? 0} icon={Key} color="bg-amber-500/10 text-amber-500 dark:text-amber-400" testId="card-total-keys" />
          <StatCard title="Active Keys" value={stats?.activeKeys ?? 0} icon={Shield} color="bg-emerald-500/10 text-emerald-500 dark:text-emerald-400" testId="card-active-keys" />
          <StatCard title="Expired Keys" value={stats?.expiredKeys ?? 0} icon={Clock} color="bg-red-500/10 text-red-500 dark:text-red-400" testId="card-expired-keys" />
          <StatCard title="Blocked Keys" value={stats?.blockedKeys ?? 0} icon={Ban} color="bg-orange-500/10 text-orange-500 dark:text-orange-400" testId="card-blocked-keys" />
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
        <SectionHeader icon={Users} title="Scope Overview" />
        <div>
          <InfoRow label="Users Under You" value={stats?.totalUsers ?? 0} testId="info-total-users" />
          <InfoRow label="Pending Approvals" value={stats?.pendingUsers ?? 0} testId="info-pending-users" />
          <InfoRow label="Referrals Created" value={stats?.totalReferrals ?? 0} testId="info-total-referrals" />
        </div>
      </div>
    </>
  );
}

function ResellerStats({ stats }: { stats: any }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card shadow-sm overflow-hidden">
      <SectionHeader icon={Key} title="Key Statistics" />
      <div className="p-4 grid gap-3 grid-cols-1 sm:grid-cols-2">
        <StatCard title="Total Keys" value={stats?.totalKeys ?? 0} icon={Key} color="bg-amber-500/10 text-amber-500 dark:text-amber-400" testId="card-total-keys" />
        <StatCard title="Active Keys" value={stats?.activeKeys ?? 0} icon={Shield} color="bg-emerald-500/10 text-emerald-500 dark:text-emerald-400" testId="card-active-keys" />
        <StatCard title="Expired Keys" value={stats?.expiredKeys ?? 0} icon={Clock} color="bg-red-500/10 text-red-500 dark:text-red-400" testId="card-expired-keys" />
        <StatCard title="Blocked Keys" value={stats?.blockedKeys ?? 0} icon={Ban} color="bg-orange-500/10 text-orange-500 dark:text-orange-400" testId="card-blocked-keys" />
      </div>
    </div>
  );
}
