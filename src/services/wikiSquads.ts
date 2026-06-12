// Fetches and parses real WC 2026 squad data from Wikipedia's public API.
// The MediaWiki API returns rendered HTML which we parse for squad tables.

export interface WikiPlayer {
  number: number;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  club: string;
  age: number;
  caps: number;
}

export interface WikiSquad {
  coach: string;
  players: WikiPlayer[];
}

// ── Name mapping from Wikipedia to our GROUPS naming ──────────────────────────

const WIKI_NAME_MAP: Record<string, string> = {
  'Czech Republic':               'Czechia',
  'United States':               'USA',
  'United States of America':    'USA',
  'Korea Republic':              'South Korea',
  "Côte d'Ivoire":               'Ivory Coast',
  'Cote d\'Ivoire':              'Ivory Coast',
  'Bosnia and Herzegovina':      'Bosnia & Herzegovina',
  'Democratic Republic of the Congo': 'DR Congo',
};

// Map our internal team names to Wikipedia section headers
const INTERNAL_TO_WIKI: Record<string, string> = {
  'Czechia': 'Czech Republic',
  'USA': 'United States',
  'South Korea': 'South Korea',
  'Ivory Coast': "Côte d'Ivoire",
  'Bosnia & Herzegovina': 'Bosnia and Herzegovina',
  'DR Congo': 'Democratic Republic of the Congo',
};

export function normalizeWikiTeamName(raw: string): string {
  return WIKI_NAME_MAP[raw] ?? raw;
}

// Module-level cache
let cachedHtml: string | null = null;
let fetchPromise: Promise<string | null> | null = null;

async function loadHtml(): Promise<string | null> {
  if (cachedHtml !== null) return cachedHtml;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const url =
        'https://en.wikipedia.org/w/api.php' +
        '?action=parse&page=2026_FIFA_World_Cup_squads' +
        '&prop=text&format=json&origin=*&disabletoc=true&disablelimitreport=true';
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      const html: string = data?.parse?.text?.['*'] ?? '';
      if (!html) return null;
      cachedHtml = html;
      return cachedHtml;
    } catch {
      return null;
    }
  })();

  return fetchPromise;
}

// Parse position from cell text (handles GK, DF, MF, FW)
function parsePosition(cellHtml: string): WikiPlayer['position'] | null {
  const text = cellHtml.replace(/<[^>]+>/g, '').trim().toUpperCase();
  if (text === 'GK') return 'GK';
  if (text === 'DF') return 'DEF';
  if (text === 'MF') return 'MID';
  if (text === 'FW') return 'FWD';
  return null;
}

// Extract plain text from HTML cell
function stripHtml(html: string): string {
  return html
    .replace(/<img[^>]*>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract club name: take last link text after the flag icon
function parseClub(cellHtml: string): string {
  // Club cell structure: <span class="flagicon">...</span> <a href="Club">Club Name</a>
  const links = cellHtml.match(/<a[^>]*>([^<]+)<\/a>/g);
  if (!links) return 'Unknown';
  // Find the last link that looks like a club (not a federation)
  for (let i = links.length - 1; i >= 0; i--) {
    const text = stripHtml(links[i]);
    if (text && !text.toLowerCase().includes('football association') && !text.toLowerCase().includes('federation')) {
      return text;
    }
    if (text) return text; // fallback to last link
  }
  return 'Unknown';
}

// Parse age from "(aged X)" format or from birth date
function parseAge(text: string): number {
  const agedMatch = text.match(/\(aged?\s*(\d+)\)/i);
  if (agedMatch) return Number(agedMatch[1]);

  // Try parsing from birth date (YYYY-MM-DD)
  const dateMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) {
    const born = new Date(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3]));
    const now = new Date();
    let age = now.getFullYear() - born.getFullYear();
    if (now.getMonth() < born.getMonth() ||
        (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())) {
      age--;
    }
    return Math.max(0, age);
  }
  return 0;
}

// Extract number from td content
function parseNumber(html: string): number {
  const text = stripHtml(html);
  const n = Number(text);
  return isNaN(n) ? 0 : n;
}

// Extract caps from cell
function parseCaps(html: string): number {
  const text = stripHtml(html);
  const n = Number(text);
  return isNaN(n) ? 0 : n;
}

// Find coach name from "Coach: <a>...</a>" pattern
function parseCoach(html: string): string {
  const coachMatch = html.match(/Coach:\s*<a[^>]*>([^<]+)<\/a>/i);
  if (coachMatch) return coachMatch[1].trim();
  // Fallback: coach without link
  const simpleMatch = html.match(/Coach:\s*([^<\n]+)/i);
  if (simpleMatch) return simpleMatch[1].trim();
  return 'Head Coach';
}

// Find section index for a team
function findTeamSectionIndex(html: string, teamName: string): number {
  // Map internal names to Wikipedia header text
  const wikiName = INTERNAL_TO_WIKI[teamName] ?? teamName;
  // Look for h3 heading with team name
  const pattern = new RegExp(`<h3[^>]*id="[^"]*"[^>]*>\\s*${escapeRe(wikiName)}`, 'i');
  const match = html.search(pattern);
  if (match !== -1) return match;

  // Try alternate patterns
  const altPattern = new RegExp(`<h3[^>]*>\\s*${escapeRe(wikiName)}`, 'i');
  return html.search(altPattern);
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Parse squad table rows for a team
function parseTeamSquad(html: string, startIndex: number): WikiPlayer[] {
  const players: WikiPlayer[] = [];

  // Extract the first table after the team's header (within ~50000 chars)
  const slice = html.slice(startIndex, startIndex + 40000);

  // Find all rows with class "nat-fs-player"
  const rowRegex = /<tr[^>]*class="nat-fs-player"[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;

  while ((match = rowRegex.exec(slice)) !== null) {
    const rowHtml = match[1];

    // Extract cells (td and th for player name)
    const cells: { type: 'td' | 'th'; html: string }[] = [];
    const cellRegex = /<(td|th)[^>]*>([\s\S]*?)<\/\1>/gi;
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      cells.push({
        type: cellMatch[1].toLowerCase() as 'td' | 'th',
        html: cellMatch[2],
      });
    }

    if (cells.length < 5) continue;

    // Column order: No., Pos., Player, DOB (age), Caps, Goals, Club
    const numberCell = cells[0]?.html ?? '';
    const posCell = cells[1]?.html ?? '';
    const playerCell = cells[2]?.html ?? '';
    const dobCell = cells[3]?.html ?? '';
    const capsCell = cells[4]?.html ?? '';
    const clubCell = cells[6]?.html ?? '';

    const number = parseNumber(numberCell);
    const position = parsePosition(posCell);
    if (!position) continue;

    const name = stripHtml(playerCell);
    if (!name || name.length < 2) continue;

    const age = parseAge(dobCell);
    const caps = parseCaps(capsCell);
    const club = parseClub(clubCell);

    players.push({ number: number || players.length + 1, name, position, club, age, caps });
  }

  return players;
}

// Main fetch function
export async function fetchWikiSquad(teamName: string): Promise<WikiSquad | null> {
  const html = await loadHtml();
  if (!html) return null;

  const sectionIndex = findTeamSectionIndex(html, teamName);
  if (sectionIndex === -1) return null;

  const players = parseTeamSquad(html, sectionIndex);
  if (players.length < 5) return null;

  const coachSection = html.slice(sectionIndex, sectionIndex + 3000);
  const coach = parseCoach(coachSection);

  return { coach, players };
}
