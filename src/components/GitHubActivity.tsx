import { useState, useEffect } from "react";

const GITHUB_USER = "danielfang7";
const EVENTS_URL = `https://api.github.com/users/${GITHUB_USER}/events/public?per_page=100`;
const GH_HEADERS = { Accept: "application/vnd.github+json" };

/* ── Data types ── */

interface GitHubEvent {
  id: string;
  type: string;
  repo: { name: string };
  payload: {
    commits?: Array<{ message: string; sha: string }>;
    action?: string;
    pull_request?: { title: string; number: number; merged: boolean };
    ref?: string;
    ref_type?: string;
    head?: string;
    release?: { tag_name: string; name: string };
    size?: number;
  };
  created_at: string;
}

export interface DisplayEvent {
  id: string;
  type: "push" | "pr" | "branch" | "release" | "repo";
  color: string;
  repo: string;
  title: string;
  sha?: string;
  detail?: string;
  time: string;
  dateLabel: string;
  url: string;
}

/* ── Parsing ── */

function parseEvent(
  ev: GitHubEvent,
  commitMap: Map<string, string>,
): DisplayEvent | null {
  if (!ev.payload || !ev.repo) return null;
  const repo = ev.repo.name.replace(`${GITHUB_USER}/`, "");
  const repoUrl = `https://github.com/${ev.repo.name}`;
  const time = formatTimeAgo(new Date(ev.created_at));
  const dateLabel = formatDateLabel(new Date(ev.created_at));

  switch (ev.type) {
    case "PushEvent": {
      const commits = ev.payload.commits ?? [];
      const branch = (ev.payload.ref ?? "").replace("refs/heads/", "");
      const sha = ev.payload.head ?? commits[commits.length - 1]?.sha;
      const shortSha = sha?.slice(0, 7);

      // Try commit message: from payload, then from commits API lookup
      let msg =
        commits.length > 0
          ? commits[commits.length - 1].message.split("\n")[0]
          : sha
            ? commitMap.get(sha) ?? commitMap.get(shortSha ?? "")
            : undefined;

      if (!msg && branch) msg = `Pushed to ${branch}`;
      if (!msg) msg = "Push";

      const count = ev.payload.size ?? commits.length;

      return {
        id: ev.id,
        type: "push",
        color: "#6C63FF",
        repo,
        title: msg.length > 80 ? msg.slice(0, 80) + "\u2026" : msg,
        sha: shortSha,
        detail:
          count > 1
            ? `${count} commit${count > 1 ? "s" : ""}`
            : undefined,
        time,
        dateLabel,
        url: sha
          ? `${repoUrl}/commit/${sha}`
          : `${repoUrl}/commits${branch ? `/${branch}` : ""}`,
      };
    }
    case "PullRequestEvent": {
      const pr = ev.payload.pull_request;
      if (!pr?.title) return null;
      const action = ev.payload.action;
      if (action !== "opened" && action !== "closed") return null;
      const label =
        action === "closed" && pr.merged
          ? "merged"
          : action === "closed"
            ? "closed"
            : "opened";
      const color =
        label === "merged"
          ? "#A78BFA"
          : label === "opened"
            ? "#10B981"
            : "#888";
      const title = String(pr.title);
      return {
        id: ev.id,
        type: "pr",
        color,
        repo,
        title: title.length > 80 ? title.slice(0, 80) + "\u2026" : title,
        detail: `PR #${pr.number} ${label}`,
        time,
        dateLabel,
        url: `${repoUrl}/pull/${pr.number}`,
      };
    }
    case "CreateEvent": {
      const refType = ev.payload.ref_type;
      if (refType === "branch" && ev.payload.ref) {
        return {
          id: ev.id,
          type: "branch",
          color: "#38BDF8",
          repo,
          title: ev.payload.ref,
          detail: "new branch",
          time,
          dateLabel,
          url: `${repoUrl}/tree/${ev.payload.ref}`,
        };
      }
      if (refType === "repository") {
        return {
          id: ev.id,
          type: "repo",
          color: "#F59E0B",
          repo,
          title: "Created repository",
          time,
          dateLabel,
          url: repoUrl,
        };
      }
      return null;
    }
    case "ReleaseEvent": {
      const release = ev.payload.release;
      if (!release) return null;
      return {
        id: ev.id,
        type: "release",
        color: "#F59E0B",
        repo,
        title: release.name || release.tag_name,
        detail: release.tag_name,
        time,
        dateLabel,
        url: `${repoUrl}/releases/tag/${release.tag_name}`,
      };
    }
    default:
      return null;
  }
}

/* ── Time helpers ── */

function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 5) return `${weeks}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diff = today.getTime() - eventDay.getTime();
  const days = Math.round(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString("en-US", { weekday: "long" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ── Fetch logic ── */

async function fetchCommitMessages(
  repos: string[],
  shas: { repo: string; sha: string }[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  // Batch: fetch recent commits per repo
  await Promise.all(
    repos.map(async (repo) => {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${repo}/commits?per_page=30`,
          { headers: GH_HEADERS },
        );
        if (!res.ok) return;
        const commits = await res.json();
        if (!Array.isArray(commits)) return;
        for (const c of commits) {
          const msg = c.commit?.message?.split("\n")[0];
          if (msg) {
            map.set(c.sha, msg);
            map.set(c.sha.slice(0, 7), msg);
          }
        }
      } catch {
        /* skip */
      }
    }),
  );

  // Fallback: fetch individual commits still missing
  const missing = shas.filter((s) => !map.has(s.sha) && !map.has(s.sha.slice(0, 7)));
  if (missing.length > 0) {
    await Promise.all(
      missing.slice(0, 15).map(async ({ repo, sha }) => {
        try {
          const res = await fetch(
            `https://api.github.com/repos/${repo}/commits/${sha}`,
            { headers: GH_HEADERS },
          );
          if (!res.ok) return;
          const data = await res.json();
          const msg = data?.commit?.message?.split("\n")[0];
          if (msg) {
            map.set(sha, msg);
            map.set(sha.slice(0, 7), msg);
          }
        } catch {
          /* skip */
        }
      }),
    );
  }

  return map;
}

export async function fetchGitHubEvents(): Promise<DisplayEvent[]> {
  try {
    const res = await fetch(EVENTS_URL, { headers: GH_HEADERS });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const events = data as GitHubEvent[];

    // Collect repos and shas for push events that lack commit messages
    const reposNeedingCommits = new Set<string>();
    const shasNeedingMessages: { repo: string; sha: string }[] = [];
    for (const ev of events) {
      if (
        ev.type === "PushEvent" &&
        (!ev.payload.commits || ev.payload.commits.length === 0) &&
        ev.payload.head
      ) {
        reposNeedingCommits.add(ev.repo.name);
        shasNeedingMessages.push({ repo: ev.repo.name, sha: ev.payload.head });
      }
    }

    // Fetch commit messages for those repos
    const commitMap = reposNeedingCommits.size > 0
      ? await fetchCommitMessages([...reposNeedingCommits], shasNeedingMessages)
      : new Map<string, string>();

    const results: DisplayEvent[] = [];
    for (const ev of events) {
      try {
        const parsed = parseEvent(ev, commitMap);
        if (parsed) results.push(parsed);
      } catch {
        /* skip */
      }
    }
    return results.slice(0, 40);
  } catch {
    return [];
  }
}

/* ── Component ── */

interface Props {
  initialEvents: DisplayEvent[];
}

export function GitHubActivity({ initialEvents }: Props) {
  const [events, setEvents] = useState<DisplayEvent[]>(initialEvents);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const fresh = await fetchGitHubEvents();
        if (fresh.length > 0 && !controller.signal.aborted) setEvents(fresh);
      } catch {
        /* keep build-time data */
      }
    })();
    return () => controller.abort();
  }, []);

  if (events.length === 0) {
    return (
      <p
        style={{
          fontSize: "13px",
          color: "#555",
          margin: 0,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        No recent public activity found.
      </p>
    );
  }

  // Group by dateLabel, cap at 5 days and 5 events per day
  const MAX_DAYS = 5;
  const MAX_PER_DAY = 5;
  const allGroups: { label: string; events: DisplayEvent[] }[] = [];
  for (const ev of events) {
    const last = allGroups[allGroups.length - 1];
    if (last && last.label === ev.dateLabel) {
      last.events.push(ev);
    } else {
      allGroups.push({ label: ev.dateLabel, events: [ev] });
    }
  }
  const groups = allGroups.slice(0, MAX_DAYS).map((g) => ({
    ...g,
    events: g.events.slice(0, MAX_PER_DAY),
    overflow: Math.max(0, g.events.length - MAX_PER_DAY),
  }));

  let globalIdx = 0;

  return (
    <>
      <style>{`
        @keyframes ghFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .gh-col {
          animation: ghFadeUp 0.35s ease forwards;
          opacity: 0;
        }
        .gh-card {
          transition: border-color 0.15s, background 0.15s, transform 0.15s;
        }
        .gh-card:hover {
          border-color: #2a2a2a !important;
          background: #151515 !important;
          transform: translateY(-2px);
        }
        .gh-dot {
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .gh-card:hover .gh-dot {
          transform: scale(1.5);
        }
      `}</style>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {/* Horizontal scrollable timeline */}
        <div style={{ overflowX: "auto", paddingBottom: "8px" }}>
          <div style={{ display: "flex", gap: "0", minWidth: "min-content", position: "relative" }}>

            {groups.map((group, gi) => (
              <div
                key={group.label}
                className="gh-col"
                style={{
                  animationDelay: `${gi * 80}ms`,
                  display: "flex",
                  flexDirection: "column",
                  minWidth: "220px",
                  maxWidth: "280px",
                  flex: "1 0 220px",
                  position: "relative",
                }}
              >
                {/* ── Date header + horizontal line ── */}
                <div style={{ display: "flex", alignItems: "center", marginBottom: "16px", position: "relative" }}>
                  {/* Dot on horizontal timeline */}
                  <div
                    style={{
                      width: "9px",
                      height: "9px",
                      borderRadius: "50%",
                      background: "#6C63FF",
                      boxShadow: "0 0 8px rgba(108, 99, 255, 0.4)",
                      flexShrink: 0,
                      zIndex: 1,
                    }}
                    aria-hidden="true"
                  />
                  {/* Horizontal line extends to next column */}
                  <div
                    style={{
                      flex: 1,
                      height: "1px",
                      background: gi < groups.length - 1
                        ? "linear-gradient(90deg, #2a2a2a 0%, #1e1e1e 100%)"
                        : "linear-gradient(90deg, #2a2a2a 0%, transparent 100%)",
                      marginLeft: "-1px",
                    }}
                    aria-hidden="true"
                  />
                </div>

                {/* Date label */}
                <div style={{ paddingLeft: "0", paddingRight: "16px", marginBottom: "10px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#444",
                    }}
                  >
                    {group.label}
                  </span>
                </div>

                {/* ── Vertical stack of events within this date ── */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    paddingRight: "16px",
                    position: "relative",
                    paddingLeft: "16px",
                  }}
                >
                  {/* Vertical connector line */}
                  {group.events.length > 1 && (
                    <div
                      style={{
                        position: "absolute",
                        left: "3px",
                        top: "12px",
                        bottom: "12px",
                        width: "1px",
                        background: "linear-gradient(180deg, #222 0%, transparent 100%)",
                      }}
                      aria-hidden="true"
                    />
                  )}

                  {group.events.map((ev) => {
                    globalIdx++;
                    return (
                      <a
                        key={ev.id}
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          textDecoration: "none",
                          display: "block",
                          position: "relative",
                        }}
                      >
                        {/* Small dot for vertical connector */}
                        <div
                          className="gh-dot"
                          style={{
                            position: "absolute",
                            left: "-14px",
                            top: "12px",
                            width: "5px",
                            height: "5px",
                            borderRadius: "50%",
                            background: ev.color,
                            boxShadow: `0 0 4px ${ev.color}50`,
                            zIndex: 1,
                          }}
                          aria-hidden="true"
                        />

                        <div
                          className="gh-card"
                          style={{
                            padding: "8px 10px",
                            borderRadius: "8px",
                            border: "1px solid #1a1a1a",
                            background: "#111",
                          }}
                        >
                          {/* Repo + time row */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "6px",
                              marginBottom: "3px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "9px",
                                fontWeight: 600,
                                color: ev.color,
                                fontFamily: "'JetBrains Mono', monospace",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {ev.repo}
                            </span>
                            <span style={{ fontSize: "9px", color: "#2a2a2a", flexShrink: 0 }}>
                              {ev.time}
                            </span>
                          </div>

                          {/* Commit message */}
                          <p
                            style={{
                              fontSize: "11px",
                              color: "#888",
                              margin: 0,
                              lineHeight: 1.45,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {ev.title}
                          </p>

                          {/* Bottom: sha + detail badge */}
                          {(ev.sha || ev.detail) && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                marginTop: "4px",
                              }}
                            >
                              {ev.sha && (
                                <span
                                  style={{
                                    fontSize: "9px",
                                    color: "#2e2e2e",
                                    fontFamily: "'JetBrains Mono', monospace",
                                  }}
                                >
                                  {ev.sha}
                                </span>
                              )}
                              {ev.detail && (
                                <span
                                  style={{
                                    fontSize: "8px",
                                    padding: "1px 5px",
                                    borderRadius: "3px",
                                    background: `${ev.color}10`,
                                    border: `1px solid ${ev.color}20`,
                                    color: `${ev.color}99`,
                                    fontWeight: 500,
                                  }}
                                >
                                  {ev.detail}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </a>
                    );
                  })}

                  {/* Overflow indicator */}
                  {group.overflow > 0 && (
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#333",
                        paddingTop: "4px",
                        paddingLeft: "2px",
                      }}
                    >
                      +{group.overflow} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GitHub link */}
        <div style={{ marginTop: "16px" }}>
          <a
            href={`https://github.com/${GITHUB_USER}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "11px",
              color: "#333",
              textDecoration: "none",
              letterSpacing: "0.04em",
              transition: "color 0.15s",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "#888")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "#333")
            }
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            View all activity on GitHub
          </a>
        </div>
      </div>
    </>
  );
}
