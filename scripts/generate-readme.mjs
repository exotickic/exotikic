import { writeFile } from "node:fs/promises";

const ko = {
  title: "\uD480\uC2A4\uD0DD \uAC1C\uBC1C\uC790",
  location: "\uB3D9\uC790\uBC14, \uC778\uB3C4\uB124\uC2DC\uC544",
  about: "\uC18C\uAC1C",
  stack: "\uC2A4\uD0DD",
  workingOn: "\uC791\uC5C5 \uC911",
  workflow: "\uC6CC\uD06C\uD50C\uB85C\uC6B0",
  stats: "\uD1B5\uACC4",
  intro:
    "\uC778\uB3C4\uB124\uC2DC\uC544 \uB3D9\uC790\uBC14\uC5D0\uC11C \uD65C\uB3D9 \uC911\uC778 \uAC1C\uBC1C\uC790 Faisal\uC785\uB2C8\uB2E4. \uC6F9 \uC778\uD130\uD398\uC774\uC2A4, \uBC31\uC5D4\uB4DC \uC11C\uBE44\uC2A4, \uC791\uC740 \uAC1C\uBC1C \uB3C4\uAD6C\uB97C \uB9CC\uB4E4\uBA70 \uB2E8\uC21C\uD55C \uAD6C\uC870\uC640 \uAE54\uB054\uD55C \uD654\uBA74, \uC2E4\uC81C\uB85C \uC4F8\uBAA8 \uC788\uB294 \uB514\uD14C\uC77C\uC744 \uC88B\uC544\uD569\uB2C8\uB2E4.",
  items: [
    "\uAC1C\uC778 \uC6F9 \uD504\uB85C\uC81D\uD2B8\uC640 \uD3EC\uD2B8\uD3F4\uB9AC\uC624 \uC2E4\uD5D8",
    "\uB354 \uAE54\uB054\uD55C UI\uC640 \uAC1C\uBC1C \uACBD\uD5D8\uC744 \uC704\uD55C \uD480\uC2A4\uD0DD \uC571 \uD328\uD134",
    "\uC77C\uC0C1 \uAC1C\uBC1C\uC744 \uB354 \uBE60\uB974\uAC8C \uB9CC\uB4DC\uB294 \uC791\uC740 \uB3C4\uAD6C",
  ],
  flow: {
    idea: "\uC544\uC774\uB514\uC5B4",
    design: "\uC124\uACC4",
    code: "\uAC1C\uBC1C",
    test: "\uD14C\uC2A4\uD2B8",
    ship: "\uBC30\uD3EC",
    learn: "\uD559\uC2B5",
  },
};

const profile = {
  username: "exotickic",
  name: "Faisal",
  title: ko.title,
  titleEn: "full-stack developer",
  location: "east java, indonesia",
  locationKo: ko.location,
  since: "2022",
  group: "personal workspace",
  stack: {
    core: ["typescript", "javascript", "react", "node"],
    frontend: ["html", "css", "js", "ts", "react", "nextjs", "tailwind"],
    backend: ["nodejs", "express", "php", "laravel", "mysql", "mongodb"],
    tools: ["git", "github", "vscode", "figma", "vercel"],
  },
  languages: ["id", "en", "kr"],
  workingOn: ko.items,
};

const iconUrl = (items) => `https://skillicons.dev/icons?i=${items.join(",")}`;

const readme = `### ${profile.username}

${profile.title} ${"\u00B7"} ${profile.titleEn} ${profile.locationKo}

![followers](https://img.shields.io/github/followers/${profile.username}?style=flat-square&label=followers)
![stars](https://img.shields.io/github/stars/${profile.username}?style=flat-square&label=stars)
![profile views](https://komarev.com/ghpvc/?username=${profile.username}&style=flat-square&color=grey)

\`\`\`ts
const ${profile.username} = {
  name:     "${profile.name}",
  role:     "${profile.title}",
  based:    "${profile.location}",
  since:    "${profile.since}",
  stack:    ${JSON.stringify(profile.stack.core)},
  language: ${JSON.stringify(profile.languages)},
  group:    "${profile.group}",
};
\`\`\`

## ${ko.about}

${ko.intro}

## ${ko.stack}

frontend

![Frontend](${iconUrl(profile.stack.frontend)})

backend

![Backend](${iconUrl(profile.stack.backend)})

tools

![Tools](${iconUrl(profile.stack.tools)})

## ${ko.workingOn}

${profile.workingOn.map((item) => `- ${item}`).join("\n")}

## ${ko.workflow}

\`\`\`mermaid
flowchart LR
  idea[${ko.flow.idea}] --> design[${ko.flow.design}]
  design --> code[${ko.flow.code}]
  code --> test[${ko.flow.test}]
  test --> ship[${ko.flow.ship}]
  ship --> learn[${ko.flow.learn}]
  learn --> idea
\`\`\`

## ${ko.stats}

![GitHub Stats](./assets/github-stats.svg)

![Activity](./assets/activity.svg)

---

<sub>generated with \`npm run build\`</sub>
`;

await writeFile(new URL("../README.md", import.meta.url), readme, "utf8");
