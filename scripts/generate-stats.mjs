import { mkdir, writeFile } from "node:fs/promises";

const username = "exotickic";
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": `${username}-profile-readme`,
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

const colors = [
  "#2f7fd1",
  "#00a3e8",
  "#03048f",
  "#f2d84a",
  "#f5a623",
  "#7e4cc2",
  "#e5532f",
  "#2f6f9f",
  "#e95420",
  "#c43f5f",
  "#35a853",
  "#6fcf56",
];

const languageAliases = new Map([
  ["JavaScript", "JavaScript"],
  ["TypeScript", "TypeScript"],
  ["HTML", "HTML"],
  ["CSS", "CSS"],
  ["PHP", "PHP"],
  ["Blade", "Blade"],
  ["Vue", "Vue"],
  ["Shell", "Shell"],
]);

async function requestJson(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }
  return response.json();
}

async function getUser() {
  return requestJson(`https://api.github.com/users/${username}`);
}

async function getRepos() {
  const repos = [];
  for (let page = 1; page <= 5; page += 1) {
    const chunk = await requestJson(
      `https://api.github.com/users/${username}/repos?per_page=100&page=${page}&type=owner&sort=updated`,
    );
    repos.push(...chunk);
    if (chunk.length < 100) break;
  }
  return repos.filter((repo) => !repo.fork);
}

async function getLanguages(repos) {
  const totals = new Map();
  await Promise.all(
    repos.slice(0, 80).map(async (repo) => {
      try {
        const langs = await requestJson(repo.languages_url);
        for (const [language, bytes] of Object.entries(langs)) {
          const label = languageAliases.get(language) || language;
          totals.set(label, (totals.get(label) || 0) + bytes);
        }
      } catch {
        // Some archived or temporarily unavailable repos can fail; the profile still builds.
      }
    }),
  );
  return [...totals.entries()]
    .map(([name, bytes]) => ({ name, bytes }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 12);
}

async function getContributions() {
  if (!token) return { total: 0, days: [] };

  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
  const to = now.toISOString();
  const query = `
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;
  try {
    const data = await requestJson("https://api.github.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { login: username, from, to } }),
    });
    const calendar = data.data?.user?.contributionsCollection?.contributionCalendar;
    const days = calendar?.weeks.flatMap((week) => week.contributionDays) || [];
    return { total: calendar?.totalContributions || 0, days };
  } catch {
    return { total: 0, days: [] };
  }
}

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const compact = (number) => new Intl.NumberFormat("en-US").format(number || 0);

function statRow(icon, label, value, y) {
  return `
    <text x="54" y="${y}" class="icon">${icon}</text>
    <text x="78" y="${y}" class="muted">${escapeXml(label)}</text>
    <text x="338" y="${y}" class="value">${escapeXml(value)}</text>`;
}

function languageLegend(languages, total) {
  return languages
    .map((language, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = 430 + col * 142;
      const y = 86 + row * 25;
      const pct = total ? ((language.bytes / total) * 100).toFixed(2) : "0.00";
      return `
        <circle cx="${x}" cy="${y - 4}" r="4" fill="${colors[index % colors.length]}"/>
        <text x="${x + 15}" y="${y}" class="small strong">${escapeXml(language.name)}</text>
        <text x="${x + 78}" y="${y}" class="small muted">${pct}%</text>`;
    })
    .join("");
}

function languageBar(languages, total) {
  let x = 426;
  return languages
    .map((language, index) => {
      const width = Math.max(3, total ? (language.bytes / total) * 328 : 0);
      const rect = `<rect x="${x.toFixed(2)}" y="51" width="${width.toFixed(2)}" height="8" fill="${colors[index % colors.length]}"/>`;
      x += width;
      return rect;
    })
    .join("");
}

function statsSvg({ user, repos, languages, contributions }) {
  const stars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const forks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
  const languageTotal = languages.reduce((sum, language) => sum + language.bytes, 0);
  const codeBytes = repos.reduce((sum, repo) => sum + (repo.size || 0), 0);

  return `<svg width="780" height="235" viewBox="0 0 780 235" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${username} GitHub statistics">
  <style>
    .card { fill: #ffffff; stroke: #d0d7de; }
    .title { font: 600 16px Segoe UI, Arial, sans-serif; fill: #0969da; }
    .heading { font: 600 16px Segoe UI, Arial, sans-serif; fill: #111827; }
    .muted { font: 13px Segoe UI, Arial, sans-serif; fill: #344054; }
    .small { font: 12px Segoe UI, Arial, sans-serif; fill: #344054; }
    .strong { font-weight: 600; fill: #111827; }
    .value { font: 13px Segoe UI, Arial, sans-serif; fill: #344054; text-anchor: end; }
    .icon { font: 14px Segoe UI Symbol, Arial, sans-serif; fill: #57606a; text-anchor: middle; }
  </style>
  <rect x="1" y="1" width="778" height="233" rx="8" fill="#0d1117"/>
  <rect class="card" x="31" y="28" width="365" height="181" rx="5"/>
  <rect class="card" x="409" y="28" width="364" height="181" rx="5"/>
  <text x="55" y="61" class="title">Faisal's GitHub Statistics</text>
  ${statRow("*", "Stars", compact(stars), 93)}
  ${statRow("Y", "Forks", compact(forks), 118)}
  ${statRow("+", "Contributions this year", compact(contributions.total), 143)}
  ${statRow("=", "Repository size", `${compact(codeBytes)} KB`, 168)}
  ${statRow("#", "Public repositories", compact(user.public_repos), 193)}
  <text x="426" y="61" class="heading">Languages Used (By File Size)</text>
  <rect x="426" y="51" width="328" height="8" rx="3" fill="#eaeef2"/>
  ${languageBar(languages, languageTotal)}
  ${languageLegend(languages, languageTotal)}
</svg>`;
}

function activitySvg(contributions) {
  const days = contributions.days.slice(-24);
  const usableDays =
    days.length > 0
      ? days
      : Array.from({ length: 24 }, (_, index) => ({ date: String(index + 1), contributionCount: 0 }));
  const max = Math.max(1, ...usableDays.map((day) => day.contributionCount));
  const points = usableDays.map((day, index) => {
    const x = 84 + index * 28;
    const y = 202 - (day.contributionCount / max) * 155;
    return { x, y, count: day.contributionCount, label: new Date(day.date).getUTCDate() || index + 1 };
  });
  const line = points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  const gridX = points
    .map((point) => `<line x1="${point.x}" y1="47" x2="${point.x}" y2="202" class="grid"/>`)
    .join("");
  const dots = points
    .map(
      (point) =>
        `<circle cx="${point.x}" cy="${point.y}" r="${point.count > 0 ? 3.5 : 2.8}" fill="${point.count > 0 ? "#f6f8fa" : "#c9d1d9"}"/>`,
    )
    .join("");
  const labels = points
    .map((point) => `<text x="${point.x}" y="216" class="axis" text-anchor="middle">${point.label}</text>`)
    .join("");

  return `<svg width="780" height="290" viewBox="0 0 780 290" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${username} activity graph">
  <style>
    .bg { fill: #0d1117; }
    .title { font: 600 14px Segoe UI, Arial, sans-serif; fill: #2f81f7; }
    .axis { font: 9px Segoe UI, Arial, sans-serif; fill: #2f81f7; }
    .grid { stroke: #0b376d; stroke-width: 1; stroke-dasharray: 2 2; }
    .line { fill: none; stroke: #2f81f7; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
  </style>
  <rect class="bg" width="780" height="290" rx="8"/>
  <text x="390" y="24" class="title" text-anchor="middle">\uD65C\uB3D9</text>
  <line x1="84" y1="47" x2="728" y2="47" class="grid"/>
  <line x1="84" y1="78" x2="728" y2="78" class="grid"/>
  <line x1="84" y1="109" x2="728" y2="109" class="grid"/>
  <line x1="84" y1="140" x2="728" y2="140" class="grid"/>
  <line x1="84" y1="171" x2="728" y2="171" class="grid"/>
  <line x1="84" y1="202" x2="728" y2="202" class="grid"/>
  ${gridX}
  <text x="48" y="126" class="axis" transform="rotate(-90 48 126)">Contributions</text>
  <text x="390" y="240" class="axis" text-anchor="middle">Days</text>
  <polyline class="line" points="${line}"/>
  ${dots}
  ${labels}
</svg>`;
}

async function main() {
  await mkdir(new URL("../assets/", import.meta.url), { recursive: true });

  const [user, repos, contributions] = await Promise.all([getUser(), getRepos(), getContributions()]);
  const languages = await getLanguages(repos);

  await Promise.all([
    writeFile(new URL("../assets/github-stats.svg", import.meta.url), statsSvg({ user, repos, languages, contributions }), "utf8"),
    writeFile(new URL("../assets/activity.svg", import.meta.url), activitySvg(contributions), "utf8"),
  ]);
}

await main();
