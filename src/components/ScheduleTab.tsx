import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  fetchAllMatches,
  FDMatch,
  getFlag,
  isLiveStatus,
  isFinishedStatus,
} from '../services/footballData';
import { useInterval } from '../hooks/useInterval';
import MatchDetailModal from './MatchDetailModal';
function etToLocal(timeET: string, date: string): string {
  const match = timeET.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return timeET;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  const utcHours = hours + 4;;
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCHours(utcHours, minutes, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
function etToLocalDate(timeET: string, date: string): string {
  const match = timeET.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return date;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  const utcHours = hours + 4;
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCHours(utcHours, minutes, 0, 0);
  return d.toLocaleDateString('en-CA');
}
interface StaticMatch {
  matchNum: number;
  group: string;
  home: string;
  homeFlag: string;
  away: string;
  awayFlag: string;
  date: string;
  timeET: string;
  stadium: string;
  city: string;
  stage: string;
}

const FIFA_RANK: Record<string, number> = {
  Argentina:1, France:2, Spain:3, England:4, Brazil:5,
  Portugal:6, Netherlands:7, Belgium:8, Germany:9,
  Morocco:12, USA:13, Mexico:15, Colombia:16, Uruguay:17,
  Japan:18, Croatia:19, Senegal:20, Switzerland:22, 'South Korea':23,
  Turkey:28, Australia:30, Norway:32, Algeria:35, Ecuador:36,
  Sweden:37, Qatar:37, Iran:38, Egypt:39, Tunisia:42,
  'Ivory Coast':43, Ghana:45, Paraguay:46, 'Saudi Arabia':55,
  'South Africa':66, 'New Zealand':96,
  Austria:25, Scotland:40, Czechia:34, Canada:48,
  'Bosnia & Herzegovina':60, Haiti:88, 'Curaçao':110,
  Iraq:66, 'DR Congo':65, Uzbekistan:73, Panama:74,
  'Cape Verde':80, Jordan:81,
};

function calcWinProbs(home: string, away: string): { h: number; d: number; a: number } {
  const rH = FIFA_RANK[home] ?? 80;
  const rA = FIFA_RANK[away] ?? 80;
  const s = rA / (rH + rA);
  const imbalance = Math.abs(s - 0.5) * 2;
  const d = Math.max(10, Math.round(26 - imbalance * 14));
  const remaining = 100 - d;
  const h = Math.max(12, Math.min(remaining - 12, Math.round(s * remaining)));
  const a = 100 - h - d;
  return { h, d, a };
}

const GROUP_FIXTURES: StaticMatch[] = [
  { matchNum:1,  group:'A', home:'Mexico',      homeFlag:'🇲🇽', away:'South Africa', awayFlag:'🇿🇦', date:'2026-06-11', timeET:'9:00 PM ET',  stadium:'SoFi Stadium',            city:'Los Angeles',        stage:'Group Stage' },
  { matchNum:2,  group:'A', home:'South Korea', homeFlag:'🇰🇷', away:'Czechia',      awayFlag:'🇨🇿', date:'2026-06-12', timeET:'9:00 PM ET',  stadium:'AT&T Stadium',            city:'Dallas',             stage:'Group Stage' },
  { matchNum:3,  group:'A', home:'Mexico',      homeFlag:'🇲🇽', away:'South Korea',  awayFlag:'🇰🇷', date:'2026-06-16', timeET:'9:00 PM ET',  stadium:'Rose Bowl',               city:'Los Angeles',        stage:'Group Stage' },
  { matchNum:4,  group:'A', home:'South Africa',homeFlag:'🇿🇦', away:'Czechia',      awayFlag:'🇨🇿', date:'2026-06-16', timeET:'6:00 PM ET',  stadium:'SoFi Stadium',            city:'Los Angeles',        stage:'Group Stage' },
  { matchNum:5,  group:'A', home:'Mexico',      homeFlag:'🇲🇽', away:'Czechia',      awayFlag:'🇨🇿', date:'2026-06-20', timeET:'6:00 PM ET',  stadium:"Levi's Stadium",          city:'San Francisco',      stage:'Group Stage' },
  { matchNum:6,  group:'A', home:'South Africa',homeFlag:'🇿🇦', away:'South Korea',  awayFlag:'🇰🇷', date:'2026-06-20', timeET:'6:00 PM ET',  stadium:'SoFi Stadium',            city:'Los Angeles',        stage:'Group Stage' },
  { matchNum:7,  group:'B', home:'Canada',      homeFlag:'🇨🇦', away:'Bosnia & Herzegovina', awayFlag:'🇧🇦', date:'2026-06-12', timeET:'6:00 PM ET', stadium:'BC Place', city:'Vancouver', stage:'Group Stage' },
  { matchNum:8,  group:'B', home:'Qatar',       homeFlag:'🇶🇦', away:'Switzerland',  awayFlag:'🇨🇭', date:'2026-06-12', timeET:'3:00 PM ET',  stadium:'MetLife Stadium',         city:'New York/New Jersey', stage:'Group Stage' },
  { matchNum:9,  group:'B', home:'Canada',      homeFlag:'🇨🇦', away:'Qatar',        awayFlag:'🇶🇦', date:'2026-06-17', timeET:'6:00 PM ET',  stadium:'BMO Field',               city:'Toronto',            stage:'Group Stage' },
  { matchNum:10, group:'B', home:'Bosnia & Herzegovina', homeFlag:'🇧🇦', away:'Switzerland', awayFlag:'🇨🇭', date:'2026-06-17', timeET:'9:00 PM ET', stadium:'Hard Rock Stadium', city:'Miami', stage:'Group Stage' },
  { matchNum:11, group:'B', home:'Canada',      homeFlag:'🇨🇦', away:'Switzerland',  awayFlag:'🇨🇭', date:'2026-06-21', timeET:'6:00 PM ET',  stadium:'BC Place',                city:'Vancouver',          stage:'Group Stage' },
  { matchNum:12, group:'B', home:'Bosnia & Herzegovina', homeFlag:'🇧🇦', away:'Qatar', awayFlag:'🇶🇦', date:'2026-06-21', timeET:'6:00 PM ET', stadium:'Estadio Azteca', city:'Mexico City', stage:'Group Stage' },
  { matchNum:13, group:'C', home:'Brazil',      homeFlag:'🇧🇷', away:'Morocco',      awayFlag:'🇲🇦', date:'2026-06-13', timeET:'9:00 PM ET',  stadium:'Rose Bowl',               city:'Los Angeles',        stage:'Group Stage' },
  { matchNum:14, group:'C', home:'Haiti',       homeFlag:'🇭🇹', away:'Scotland',     awayFlag:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', date:'2026-06-13', timeET:'3:00 PM ET',  stadium:'AT&T Stadium',            city:'Dallas',             stage:'Group Stage' },
  { matchNum:15, group:'C', home:'Brazil',      homeFlag:'🇧🇷', away:'Haiti',        awayFlag:'🇭🇹', date:'2026-06-17', timeET:'9:00 PM ET',  stadium:'SoFi Stadium',            city:'Los Angeles',        stage:'Group Stage' },
  { matchNum:16, group:'C', home:'Morocco',     homeFlag:'🇲🇦', away:'Scotland',     awayFlag:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', date:'2026-06-17', timeET:'3:00 PM ET',  stadium:'Lumen Field',             city:'Seattle',            stage:'Group Stage' },
  { matchNum:17, group:'C', home:'Brazil',      homeFlag:'🇧🇷', away:'Scotland',     awayFlag:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', date:'2026-06-21', timeET:'9:00 PM ET',  stadium:'AT&T Stadium',            city:'Dallas',             stage:'Group Stage' },
  { matchNum:18, group:'C', home:'Morocco',     homeFlag:'🇲🇦', away:'Haiti',        awayFlag:'🇭🇹', date:'2026-06-21', timeET:'9:00 PM ET',  stadium:'Rose Bowl',               city:'Los Angeles',        stage:'Group Stage' },
  { matchNum:19, group:'D', home:'USA',         homeFlag:'🇺🇸', away:'Paraguay',     awayFlag:'🇵🇾', date:'2026-06-14', timeET:'6:00 PM ET',  stadium:'SoFi Stadium',            city:'Los Angeles',        stage:'Group Stage' },
  { matchNum:20, group:'D', home:'Australia',   homeFlag:'🇦🇺', away:'Turkey',       awayFlag:'🇹🇷', date:'2026-06-14', timeET:'9:00 PM ET',  stadium:'AT&T Stadium',            city:'Dallas',             stage:'Group Stage' },
  { matchNum:21, group:'D', home:'USA',         homeFlag:'🇺🇸', away:'Australia',    awayFlag:'🇦🇺', date:'2026-06-18', timeET:'9:00 PM ET',  stadium:'MetLife Stadium',         city:'New York/New Jersey', stage:'Group Stage' },
  { matchNum:22, group:'D', home:'Paraguay',    homeFlag:'🇵🇾', away:'Turkey',       awayFlag:'🇹🇷', date:'2026-06-18', timeET:'6:00 PM ET',  stadium:'Hard Rock Stadium',       city:'Miami',              stage:'Group Stage' },
  { matchNum:23, group:'D', home:'USA',         homeFlag:'🇺🇸', away:'Turkey',       awayFlag:'🇹🇷', date:'2026-06-22', timeET:'9:00 PM ET',  stadium:"Levi's Stadium",          city:'San Francisco',      stage:'Group Stage' },
  { matchNum:24, group:'D', home:'Australia',   homeFlag:'🇦🇺', away:'Paraguay',     awayFlag:'🇵🇾', date:'2026-06-22', timeET:'6:00 PM ET',  stadium:'BC Place',                city:'Vancouver',          stage:'Group Stage' },
  { matchNum:25, group:'E', home:'Germany',     homeFlag:'🇩🇪', away:'Curaçao',      awayFlag:'🇨🇼', date:'2026-06-14', timeET:'3:00 PM ET',  stadium:'Lincoln Financial Field', city:'Philadelphia',       stage:'Group Stage' },
  { matchNum:26, group:'E', home:'Ivory Coast', homeFlag:'🇨🇮', away:'Ecuador',      awayFlag:'🇪🇨', date:'2026-06-14', timeET:'12:00 PM ET', stadium:'Gillette Stadium',        city:'Boston',             stage:'Group Stage' },
  { matchNum:27, group:'E', home:'Germany',     homeFlag:'🇩🇪', away:'Ivory Coast',  awayFlag:'🇨🇮', date:'2026-06-18', timeET:'3:00 PM ET',  stadium:'Arrowhead Stadium',       city:'Kansas City',        stage:'Group Stage' },
  { matchNum:28, group:'E', home:'Curaçao',     homeFlag:'🇨🇼', away:'Ecuador',      awayFlag:'🇪🇨', date:'2026-06-18', timeET:'12:00 PM ET', stadium:'Estadio Azteca',          city:'Mexico City',        stage:'Group Stage' },
  { matchNum:29, group:'E', home:'Germany',     homeFlag:'🇩🇪', away:'Ecuador',      awayFlag:'🇪🇨', date:'2026-06-22', timeET:'3:00 PM ET',  stadium:'MetLife Stadium',         city:'New York/New Jersey', stage:'Group Stage' },
  { matchNum:30, group:'E', home:'Ivory Coast', homeFlag:'🇨🇮', away:'Curaçao',      awayFlag:'🇨🇼', date:'2026-06-22', timeET:'3:00 PM ET',  stadium:'Lincoln Financial Field', city:'Philadelphia',       stage:'Group Stage' },
  { matchNum:31, group:'F', home:'Netherlands', homeFlag:'🇳🇱', away:'Japan',        awayFlag:'🇯🇵', date:'2026-06-15', timeET:'9:00 PM ET',  stadium:'SoFi Stadium',            city:'Los Angeles',        stage:'Group Stage' },
  { matchNum:32, group:'F', home:'Sweden',      homeFlag:'🇸🇪', away:'Tunisia',      awayFlag:'🇹🇳', date:'2026-06-15', timeET:'6:00 PM ET',  stadium:'Estadio BBVA',            city:'Monterrey',          stage:'Group Stage' },
  { matchNum:33, group:'F', home:'Netherlands', homeFlag:'🇳🇱', away:'Sweden',       awayFlag:'🇸🇪', date:'2026-06-19', timeET:'6:00 PM ET',  stadium:'Rose Bowl',               city:'Los Angeles',        stage:'Group Stage' },
  { matchNum:34, group:'F', home:'Japan',       homeFlag:'🇯🇵', away:'Tunisia',      awayFlag:'🇹🇳', date:'2026-06-19', timeET:'9:00 PM ET',  stadium:'AT&T Stadium',            city:'Dallas',             stage:'Group Stage' },
  { matchNum:35, group:'F', home:'Netherlands', homeFlag:'🇳🇱', away:'Tunisia',      awayFlag:'🇹🇳', date:'2026-06-23', timeET:'9:00 PM ET',  stadium:"Levi's Stadium",          city:'San Francisco',      stage:'Group Stage' },
  { matchNum:36, group:'F', home:'Japan',       homeFlag:'🇯🇵', away:'Sweden',       awayFlag:'🇸🇪', date:'2026-06-23', timeET:'6:00 PM ET',  stadium:'AT&T Stadium',            city:'Dallas',             stage:'Group Stage' },
  { matchNum:37, group:'G', home:'Belgium',     homeFlag:'🇧🇪', away:'Egypt',        awayFlag:'🇪🇬', date:'2026-06-15', timeET:'3:00 PM ET',  stadium:'Mercedes-Benz Stadium',   city:'Atlanta',            stage:'Group Stage' },
  { matchNum:38, group:'G', home:'Iran',        homeFlag:'🇮🇷', away:'New Zealand',  awayFlag:'🇳🇿', date:'2026-06-15', timeET:'12:00 PM ET', stadium:'Gillette Stadium',        city:'Boston',             stage:'Group Stage' },
  { matchNum:39, group:'G', home:'Belgium',     homeFlag:'🇧🇪', away:'Iran',         awayFlag:'🇮🇷', date:'2026-06-19', timeET:'3:00 PM ET',  stadium:'Hard Rock Stadium',       city:'Miami',              stage:'Group Stage' },
  { matchNum:40, group:'G', home:'Egypt',       homeFlag:'🇪🇬', away:'New Zealand',  awayFlag:'🇳🇿', date:'2026-06-19', timeET:'12:00 PM ET', stadium:'Lincoln Financial Field', city:'Philadelphia',       stage:'Group Stage' },
  { matchNum:41, group:'G', home:'Belgium',     homeFlag:'🇧🇪', away:'New Zealand',  awayFlag:'🇳🇿', date:'2026-06-23', timeET:'3:00 PM ET',  stadium:'BC Place',                city:'Vancouver',          stage:'Group Stage' },
  { matchNum:42, group:'G', home:'Egypt',       homeFlag:'🇪🇬', away:'Iran',         awayFlag:'🇮🇷', date:'2026-06-23', timeET:'3:00 PM ET',  stadium:'Estadio Azteca',          city:'Mexico City',        stage:'Group Stage' },
  { matchNum:43, group:'H', home:'Spain',       homeFlag:'🇪🇸', away:'Cape Verde',   awayFlag:'🇨🇻', date:'2026-06-16', timeET:'3:00 PM ET',  stadium:'Mercedes-Benz Stadium',   city:'Atlanta',            stage:'Group Stage' },
  { matchNum:44, group:'H', home:'Saudi Arabia',homeFlag:'🇸🇦', away:'Uruguay',      awayFlag:'🇺🇾', date:'2026-06-16', timeET:'12:00 PM ET', stadium:'Arrowhead Stadium',       city:'Kansas City',        stage:'Group Stage' },
  { matchNum:45, group:'H', home:'Spain',       homeFlag:'🇪🇸', away:'Saudi Arabia', awayFlag:'🇸🇦', date:'2026-06-20', timeET:'3:00 PM ET',  stadium:'Lumen Field',             city:'Seattle',            stage:'Group Stage' },
  { matchNum:46, group:'H', home:'Cape Verde',  homeFlag:'🇨🇻', away:'Uruguay',      awayFlag:'🇺🇾', date:'2026-06-20', timeET:'12:00 PM ET', stadium:'Mercedes-Benz Stadium',   city:'Atlanta',            stage:'Group Stage' },
  { matchNum:47, group:'H', home:'Spain',       homeFlag:'🇪🇸', away:'Uruguay',      awayFlag:'🇺🇾', date:'2026-06-24', timeET:'3:00 PM ET',  stadium:'Hard Rock Stadium',       city:'Miami',              stage:'Group Stage' },
  { matchNum:48, group:'H', home:'Cape Verde',  homeFlag:'🇨🇻', away:'Saudi Arabia', awayFlag:'🇸🇦', date:'2026-06-24', timeET:'3:00 PM ET',  stadium:"Levi's Stadium",          city:'San Francisco',      stage:'Group Stage' },
  { matchNum:49, group:'I', home:'France',      homeFlag:'🇫🇷', away:'Senegal',      awayFlag:'🇸🇳', date:'2026-06-17', timeET:'9:00 PM ET',  stadium:'MetLife Stadium',         city:'New York/New Jersey', stage:'Group Stage' },
  { matchNum:50, group:'I', home:'Iraq',        homeFlag:'🇮🇶', away:'Norway',       awayFlag:'🇳🇴', date:'2026-06-17', timeET:'12:00 PM ET', stadium:'Estadio BBVA',            city:'Monterrey',          stage:'Group Stage' },
  { matchNum:51, group:'I', home:'France',      homeFlag:'🇫🇷', away:'Iraq',         awayFlag:'🇮🇶', date:'2026-06-21', timeET:'9:00 PM ET',  stadium:'Gillette Stadium',        city:'Boston',             stage:'Group Stage' },
  { matchNum:52, group:'I', home:'Senegal',     homeFlag:'🇸🇳', away:'Norway',       awayFlag:'🇳🇴', date:'2026-06-21', timeET:'3:00 PM ET',  stadium:'Lincoln Financial Field', city:'Philadelphia',       stage:'Group Stage' },
  { matchNum:53, group:'I', home:'France',      homeFlag:'🇫🇷', away:'Norway',       awayFlag:'🇳🇴', date:'2026-06-25', timeET:'3:00 PM ET',  stadium:'MetLife Stadium',         city:'New York/New Jersey', stage:'Group Stage' },
  { matchNum:54, group:'I', home:'Senegal',     homeFlag:'🇸🇳', away:'Iraq',         awayFlag:'🇮🇶', date:'2026-06-25', timeET:'3:00 PM ET',  stadium:'Arrowhead Stadium',       city:'Kansas City',        stage:'Group Stage' },
  { matchNum:55, group:'J', home:'Argentina',   homeFlag:'🇦🇷', away:'Algeria',      awayFlag:'🇩🇿', date:'2026-06-18', timeET:'9:00 PM ET',  stadium:'MetLife Stadium',         city:'New York/New Jersey', stage:'Group Stage' },
  { matchNum:56, group:'J', home:'Austria',     homeFlag:'🇦🇹', away:'Jordan',       awayFlag:'🇯🇴', date:'2026-06-18', timeET:'6:00 PM ET',  stadium:'Estadio Azteca',          city:'Mexico City',        stage:'Group Stage' },
  { matchNum:57, group:'J', home:'Argentina',   homeFlag:'🇦🇷', away:'Austria',      awayFlag:'🇦🇹', date:'2026-06-22', timeET:'9:00 PM ET',  stadium:'Hard Rock Stadium',       city:'Miami',              stage:'Group Stage' },
  { matchNum:58, group:'J', home:'Algeria',     homeFlag:'🇩🇿', away:'Jordan',       awayFlag:'🇯🇴', date:'2026-06-22', timeET:'6:00 PM ET',  stadium:'Gillette Stadium',        city:'Boston',             stage:'Group Stage' },
  { matchNum:59, group:'J', home:'Argentina',   homeFlag:'🇦🇷', away:'Jordan',       awayFlag:'🇯🇴', date:'2026-06-26', timeET:'6:00 PM ET',  stadium:'SoFi Stadium',            city:'Los Angeles',        stage:'Group Stage' },
  { matchNum:60, group:'J', home:'Algeria',     homeFlag:'🇩🇿', away:'Austria',      awayFlag:'🇦🇹', date:'2026-06-26', timeET:'6:00 PM ET',  stadium:'Mercedes-Benz Stadium',   city:'Atlanta',            stage:'Group Stage' },
  { matchNum:61, group:'K', home:'Portugal',    homeFlag:'🇵🇹', away:'DR Congo',     awayFlag:'🇨🇩', date:'2026-06-19', timeET:'9:00 PM ET',  stadium:"Levi's Stadium",          city:'San Francisco',      stage:'Group Stage' },
  { matchNum:62, group:'K', home:'Uzbekistan',  homeFlag:'🇺🇿', away:'Colombia',     awayFlag:'🇨🇴', date:'2026-06-19', timeET:'12:00 PM ET', stadium:'BC Place',                city:'Vancouver',          stage:'Group Stage' },
  { matchNum:63, group:'K', home:'Portugal',    homeFlag:'🇵🇹', away:'Uzbekistan',   awayFlag:'🇺🇿', date:'2026-06-23', timeET:'9:00 PM ET',  stadium:'SoFi Stadium',            city:'Los Angeles',        stage:'Group Stage' },
  { matchNum:64, group:'K', home:'DR Congo',    homeFlag:'🇨🇩', away:'Colombia',     awayFlag:'🇨🇴', date:'2026-06-23', timeET:'12:00 PM ET', stadium:'Arrowhead Stadium',       city:'Kansas City',        stage:'Group Stage' },
  { matchNum:65, group:'K', home:'Portugal',    homeFlag:'🇵🇹', away:'Colombia',     awayFlag:'🇨🇴', date:'2026-06-27', timeET:'6:00 PM ET',  stadium:'MetLife Stadium',         city:'New York/New Jersey', stage:'Group Stage' },
  { matchNum:66, group:'K', home:'DR Congo',    homeFlag:'🇨🇩', away:'Uzbekistan',   awayFlag:'🇺🇿', date:'2026-06-27', timeET:'6:00 PM ET',  stadium:'Lumen Field',             city:'Seattle',            stage:'Group Stage' },
  { matchNum:67, group:'L', home:'England',     homeFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', away:'Croatia',  awayFlag:'🇭🇷', date:'2026-06-20', timeET:'9:00 PM ET',  stadium:'Lincoln Financial Field', city:'Philadelphia',       stage:'Group Stage' },
  { matchNum:68, group:'L', home:'Ghana',       homeFlag:'🇬🇭', away:'Panama',       awayFlag:'🇵🇦', date:'2026-06-20', timeET:'3:00 PM ET',  stadium:'Estadio BBVA',            city:'Monterrey',          stage:'Group Stage' },
  { matchNum:69, group:'L', home:'England',     homeFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', away:'Ghana',    awayFlag:'🇬🇭', date:'2026-06-24', timeET:'9:00 PM ET',  stadium:'Gillette Stadium',        city:'Boston',             stage:'Group Stage' },
  { matchNum:70, group:'L', home:'Croatia',     homeFlag:'🇭🇷', away:'Panama',       awayFlag:'🇵🇦', date:'2026-06-24', timeET:'6:00 PM ET',  stadium:'Mercedes-Benz Stadium',   city:'Atlanta',            stage:'Group Stage' },
  { matchNum:71, group:'L', home:'England',     homeFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', away:'Panama',  awayFlag:'🇵🇦', date:'2026-06-28', timeET:'6:00 PM ET',  stadium:'MetLife Stadium',         city:'New York/New Jersey', stage:'Group Stage' },
  { matchNum:72, group:'L', home:'Croatia',     homeFlag:'🇭🇷', away:'Ghana',        awayFlag:'🇬🇭', date:'2026-06-28', timeET:'6:00 PM ET',  stadium:"Levi's Stadium",          city:'San Francisco',      stage:'Group Stage' },
];

const R32_DATES = [
  '2026-06-28','2026-06-28','2026-06-28',
  '2026-06-29','2026-06-29','2026-06-29',
  '2026-06-30','2026-06-30','2026-06-30',
  '2026-07-01','2026-07-01',
  '2026-07-02','2026-07-02',
  '2026-07-03','2026-07-03','2026-07-03',
];
const R16_DATES = ['2026-07-04','2026-07-04','2026-07-05','2026-07-05','2026-07-06','2026-07-06','2026-07-07','2026-07-07'];
const QF_DATES  = ['2026-07-09','2026-07-09','2026-07-10','2026-07-11'];
const SF_DATES  = ['2026-07-14','2026-07-15'];

const KNOCKOUT_FIXTURES: StaticMatch[] = [
  ...R32_DATES.map((date, i) => ({
    matchNum: 73 + i, group: '', home: 'TBD', homeFlag: '🏳', away: 'TBD', awayFlag: '🏳',
    date, timeET: '3:00 PM ET', stadium: 'TBD', city: 'TBD', stage: 'Round of 32',
  })),
  ...R16_DATES.map((date, i) => ({
    matchNum: 89 + i, group: '', home: 'TBD', homeFlag: '🏳', away: 'TBD', awayFlag: '🏳',
    date, timeET: '3:00 PM ET', stadium: 'TBD', city: 'TBD', stage: 'Round of 16',
  })),
  ...QF_DATES.map((date, i) => ({
    matchNum: 97 + i, group: '', home: 'TBD', homeFlag: '🏳', away: 'TBD', awayFlag: '🏳',
    date, timeET: '3:00 PM ET', stadium: 'TBD', city: 'TBD', stage: 'Quarterfinals',
  })),
  ...SF_DATES.map((date, i) => ({
    matchNum: 101 + i, group: '', home: 'TBD', homeFlag: '🏳', away: 'TBD', awayFlag: '🏳',
    date, timeET: '3:00 PM ET', stadium: 'MetLife Stadium', city: 'New York/New Jersey', stage: 'Semifinals',
  })),
  { matchNum:103, group:'', home:'TBD', homeFlag:'🏳', away:'TBD', awayFlag:'🏳', date:'2026-07-18', timeET:'3:00 PM ET', stadium:'Hard Rock Stadium', city:'Miami', stage:'Third Place' },
  { matchNum:104, group:'', home:'TBD', homeFlag:'🏳', away:'TBD', awayFlag:'🏳', date:'2026-07-19', timeET:'6:00 PM ET', stadium:'MetLife Stadium', city:'New York/New Jersey', stage:'Final' },
];

const ALL_FIXTURES = [...GROUP_FIXTURES, ...KNOCKOUT_FIXTURES];
const STAGE_ORDER = ['Group Stage', 'Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals', 'Third Place', 'Final'];

const STAGE_HEX: Record<string, string> = {
  'Group Stage':  '#0057A8',
  'Round of 32':  '#E3000B',
  'Round of 16':  '#6B2D8B',
  'Quarterfinals':'#0057A8',
  'Semifinals':   '#00A850',
  'Third Place':  '#4b5563',
  'Final':        '#C8D400',
};

const DATE_STAGE_LABEL: Record<string, string> = {
  '2026-06-11':'Group Stage','2026-06-12':'Group Stage','2026-06-13':'Group Stage',
  '2026-06-14':'Group Stage','2026-06-15':'Group Stage','2026-06-16':'Group Stage',
  '2026-06-17':'Group Stage','2026-06-18':'Group Stage','2026-06-19':'Group Stage',
  '2026-06-20':'Group Stage','2026-06-21':'Group Stage','2026-06-22':'Group Stage',
  '2026-06-23':'Group Stage','2026-06-24':'Group Stage','2026-06-25':'Group Stage',
  '2026-06-26':'Group Stage','2026-06-27':'Group Stage',
  '2026-06-28':'Round of 32','2026-06-29':'Round of 32','2026-06-30':'Round of 32',
  '2026-07-01':'Round of 32','2026-07-02':'Round of 32','2026-07-03':'Round of 32',
  '2026-07-04':'Round of 16','2026-07-05':'Round of 16','2026-07-06':'Round of 16','2026-07-07':'Round of 16',
  '2026-07-09':'Quarterfinals','2026-07-10':'Quarterfinals','2026-07-11':'Quarterfinals',
  '2026-07-14':'Semifinals','2026-07-15':'Semifinals',
  '2026-07-18':'Third Place',
  '2026-07-19':'Final',
};

function parseETKickoff(date: string, timeET: string): Date {
  const m = timeET.match(/(\d+):(\d+)\s*(AM|PM)/i);
  let hour = 12, minute = 0;
  if (m) {
    hour = parseInt(m[1]);
    minute = parseInt(m[2]);
    const isPM = m[3].toUpperCase() === 'PM';
    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
  }
  return new Date(`${date}T${String(hour + 4).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00Z`);
}
const ENRICHED_FIXTURES = ALL_FIXTURES.map(f => {
  const kickoff = parseETKickoff(f.date, f.timeET);
  return { ...f, kickoff, localDate: kickoff.toLocaleDateString('en-CA'), localTime: kickoff.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) };
});
const ALL_DATES = Array.from(new Set(ENRICHED_FIXTURES.map((f) => f.localDate))).sort();
const TODAY_ISO = new Date().toLocaleDateString('en-CA');

function formatDateBtn(iso: string): { top: string; bottom: string } {
  const d = new Date(iso + 'T12:00:00');
  return {
   top:    d.toLocaleDateString('en-US', { month: 'short' }),
bottom: d.toLocaleDateString('en-US', { day: 'numeric' }),
  };
}

function formatMatchDate(iso: string): string {
return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
  month: 'long', day: 'numeric', year: 'numeric',
});
}

function daysUntil(iso: string): number {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((new Date(iso + 'T00:00:00').getTime() - now.getTime()) / 86400000);
}

function fuzzy(a: string | null | undefined, b: string | null | undefined) {
  const al = (a ?? '').toLowerCase().replace(/[^a-z]/g, '');
  const bl = (b ?? '').toLowerCase().replace(/[^a-z]/g, '');
  if (!al || !bl) return false;
  return al.includes(bl.slice(0, 5)) || bl.includes(al.slice(0, 5));
}

function findApiMatch(fixture: StaticMatch, apiMatches: FDMatch[]): FDMatch | null {
  return apiMatches.find(
    (m) =>
      (fuzzy(fixture.home, m.homeTeam.name) && fuzzy(fixture.away, m.awayTeam.name)) ||
      (fuzzy(fixture.home, m.awayTeam.name) && fuzzy(fixture.away, m.homeTeam.name))
  ) ?? null;
}

function findLive(home: string, away: string, live: FDMatch[]): FDMatch | null {
  return live.find(
    (m) => isLiveStatus(m.status) && (
      (fuzzy(home, m.homeTeam.name) && fuzzy(away, m.awayTeam.name)) ||
      (fuzzy(home, m.awayTeam.name) && fuzzy(away, m.homeTeam.name))
    )
  ) ?? null;
}

function LiveBadge({ minute }: { minute: number | null | undefined }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5" style={{ backgroundColor: '#E3000B' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      <span className="font-anton text-white text-xs leading-none">
        🔴 LIVE{minute != null ? ` · ${minute}'` : ''}
      </span>
    </span>
  );
}

function ProbBar({ h, d, a, home, homeFlag, away, awayFlag }: {
  h: number; d: number; a: number;
  home: string; homeFlag: string;
  away: string; awayFlag: string;
}) {
  return (
    <div>
      <div className="flex h-1.5 mb-2">
        <div className="h-full" style={{ width: `${h}%`, backgroundColor: '#00A850' }} />
        {d > 0 && <div className="h-full" style={{ width: `${d}%`, backgroundColor: 'rgba(255,255,255,0.12)' }} />}
        <div className="h-full" style={{ width: `${a}%`, backgroundColor: '#E3000B' }} />
      </div>
      <p className="font-inter text-[10px] leading-tight flex flex-wrap gap-x-1">
        <span className="font-bold whitespace-nowrap" style={{ color: '#00A850' }}>{homeFlag} {home} {h}%</span>
        {d > 0 && <span className="text-gray-600 whitespace-nowrap">· Draw {d}% ·</span>}
        {d === 0 && <span className="text-gray-600">·</span>}
        <span className="font-bold whitespace-nowrap" style={{ color: '#E3000B' }}>{away} {a}% {awayFlag}</span>
      </p>
    </div>
  );
}

interface MatchCardProps {
  fixture: StaticMatch;
  liveList: FDMatch[];
  apiList: FDMatch[];
  isFinal?: boolean;
  accentHex: string;
  onMatchClick: (apiMatch: FDMatch | null, fixture: StaticMatch) => void;
}

function MatchCard({ fixture, liveList, apiList, isFinal = false, accentHex, onMatchClick }: MatchCardProps) {
  const days = daysUntil(fixture.date);
  const isTBD = fixture.home === 'TBD';

  const liveMatch = isTBD ? null : findLive(fixture.home, fixture.away, liveList);
  const apiMatch  = isTBD ? null : findApiMatch(fixture, apiList);

  const isLive     = liveMatch !== null;
  const isFinished = !isLive && apiMatch != null && isFinishedStatus(apiMatch.status);

  // Prefer live score, then API score
  const homeScore = liveMatch?.score.fullTime.home ?? apiMatch?.score.fullTime.home ?? null;
  const awayScore = liveMatch?.score.fullTime.away ?? apiMatch?.score.fullTime.away ?? null;
  const minute    = liveMatch?.minute ?? null;

  const homeWon = isFinished && homeScore !== null && awayScore !== null && homeScore > awayScore;
  const awayWon = isFinished && homeScore !== null && awayScore !== null && awayScore > homeScore;
  const probs   = isTBD ? null : calcWinProbs(fixture.home, fixture.away);

  return (
    <div
      className="dark-grain overflow-hidden flex flex-col"
      onClick={() => onMatchClick(liveMatch ?? apiMatch, fixture)}
      style={{
        backgroundColor: '#111827',
        border: isFinal ? `1px solid ${accentHex}` : '1px solid rgba(255,255,255,0.08)',
        borderTop: `3px solid ${accentHex}`,
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        // Live highlight: red left border + subtle red tint
        ...(isLive ? {
          borderLeft: '4px solid #E3000B',
          backgroundColor: 'rgba(227,0,11,0.05)',
        } : {}),
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = isLive ? '#E3000B' : accentHex;
        el.style.boxShadow = `0 0 0 1px ${accentHex}44`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = '';
        el.style.boxShadow = '';
      }}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' }}
      >
        <div className="flex items-center gap-2">
          {fixture.group && (
            <span className="font-anton text-xs tracking-widest" style={{ color: accentHex }}>
              GRP {fixture.group} ·
            </span>
          )}
          <span className="font-anton text-gray-600 text-xs tracking-widest">#{fixture.matchNum}</span>
        </div>
        <div className="flex items-center gap-2">
          {isLive && <LiveBadge minute={minute} />}
          {isFinished && <span className="font-anton text-xs tracking-widest font-bold" style={{ color: accentHex }}>FT</span>}
          {!isLive && !isFinished && days > 0 && (
            <span className="font-inter text-xs text-gray-600">in {days}d</span>
          )}
          {!isLive && !isFinished && days === 0 && (
            <span className="font-inter text-xs font-bold" style={{ color: accentHex }}>Today</span>
          )}
        </div>
      </div>

      {/* Teams + score */}
      <div className="px-3 py-4 flex items-center gap-2">
        <div className={`flex-1 flex flex-col items-center text-center min-w-0 ${isFinished && !homeWon ? 'opacity-40' : ''}`}>
          <span className="text-3xl leading-none mb-1.5">{isTBD ? '🏳' : fixture.homeFlag}</span>
          <span className={`font-inter font-bold leading-tight w-full break-words uppercase tracking-wide ${fixture.home.length > 10 ? 'text-xs' : 'text-sm'} ${homeWon ? 'text-white' : 'text-gray-400'}`}>
            {isTBD ? 'TBD' : fixture.home}
          </span>
        </div>

        <div className="flex-shrink-0 text-center w-20">
          {isLive && homeScore !== null && awayScore !== null ? (
            <span className="font-anton text-xl leading-none whitespace-nowrap text-white">
              {homeScore}<span className="text-gray-700 mx-0.5">:</span>{awayScore}
            </span>
          ) : isFinished && homeScore !== null && awayScore !== null ? (
            <div className="flex flex-col items-center gap-1">
              <span className="font-anton text-white font-black whitespace-nowrap" style={{ fontSize: '1.75rem', letterSpacing: '-0.02em' }}>
                {homeScore}
                <span className="mx-1" style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
                {awayScore}
              </span>
              <span className="font-anton text-xs tracking-widest font-bold" style={{ color: accentHex }}>FT</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-inter text-gray-600 text-xs font-semibold">{etToLocal(fixture.localTime, fixture.date)}</span>
              <span className="font-anton text-gray-700 text-xs tracking-widest">VS</span>
            </div>
          )}
        </div>

        <div className={`flex-1 flex flex-col items-center text-center min-w-0 ${isFinished && !awayWon ? 'opacity-40' : ''}`}>
          <span className="text-3xl leading-none mb-1.5">{isTBD ? '🏳' : fixture.awayFlag}</span>
          <span className={`font-inter font-bold leading-tight w-full break-words uppercase tracking-wide ${fixture.away.length > 10 ? 'text-xs' : 'text-sm'} ${awayWon ? 'text-white' : 'text-gray-400'}`}>
            {isTBD ? 'TBD' : fixture.away}
          </span>
        </div>
      </div>

      {/* Date + venue */}
      <div className="px-3 pb-3">
        <p className="font-inter text-xs text-gray-600">
          <span className="font-semibold text-gray-500">{formatMatchDate(fixture.date)}</span>
         {!isFinished && <>{' \u00B7 '}{etToLocal(fixture.localTime, fixture.date)}</>}
        </p>
        {!isTBD && fixture.city !== 'TBD' && (
          <p className="font-inter text-xs text-gray-700 mt-0.5">{fixture.stadium}, {fixture.city}</p>
        )}
      </div>

      {/* Win probability bar */}
      {probs && !isTBD && (
        <div className="px-3 pb-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <ProbBar
            h={probs.h} d={probs.d} a={probs.a}
            home={fixture.home} homeFlag={fixture.homeFlag}
            away={fixture.away} awayFlag={fixture.awayFlag}
          />
        </div>
      )}
      {isTBD && (
        <div className="px-3 pb-3 pt-2 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="font-inter text-xs text-gray-700">Prediction available after group stage</p>
        </div>
      )}
    </div>
  );
}

// ── Live summary strip shown at the top when matches are live ─────────────────

function LiveStrip({ liveMatches }: { liveMatches: FDMatch[] }) {
  const live = liveMatches.filter((m) => isLiveStatus(m.status));
  if (live.length === 0) return null;
  return (
    <div
      className="mb-6 p-4"
      style={{ backgroundColor: 'rgba(227,0,11,0.08)', border: '1px solid rgba(227,0,11,0.3)', borderLeft: '4px solid #E3000B' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2.5 h-2.5 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: '#E3000B' }} />
        <span className="font-anton text-white tracking-widest text-sm">LIVE NOW · {live.length} MATCH{live.length > 1 ? 'ES' : ''}</span>
      </div>
      <div className="flex flex-wrap gap-3">
        {live.map((m) => {
          const hs = m.score.fullTime.home ?? 0;
          const as_ = m.score.fullTime.away ?? 0;
        const hCode = String(m.homeTeam.tla || m.homeTeam.name || '???').slice(0, 3).toUpperCase();
const aCode = String(m.awayTeam.tla || m.awayTeam.name || '???').slice(0, 3).toUpperCase();
          return (
            <div
              key={m.id}
              className="flex items-center gap-2 px-3 py-2"
              style={{ backgroundColor: '#111827', border: '1px solid rgba(227,0,11,0.25)' }}
            >
              <span className="text-lg">{getFlag(m.homeTeam.name)}</span>
              <span className="font-anton text-white text-xs">{hCode}</span>
              <span className="font-anton text-white text-base leading-none">{hs}</span>
              <span className="font-anton text-gray-600 text-xs">—</span>
              <span className="font-anton text-white text-base leading-none">{as_}</span>
              <span className="font-anton text-white text-xs">{aCode}</span>
              <span className="text-lg">{getFlag(m.awayTeam.name)}</span>
              {m.minute != null && (
                <span className="font-inter text-xs font-bold ml-1" style={{ color: '#E3000B' }}>{m.minute}'</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  liveMatches: FDMatch[];
}

export default function ScheduleTab({ liveMatches }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(
    ALL_DATES.includes(TODAY_ISO) ? TODAY_ISO : ALL_DATES[0] ?? null
  );
  const [apiList, setApiList] = useState<FDMatch[]>([]);
  const [modalItem, setModalItem] = useState<{ apiMatch: FDMatch | null; fixture: StaticMatch } | null>(null);

  const handleMatchClick = useCallback((apiMatch: FDMatch | null, fixture: StaticMatch) => {
    setModalItem({ apiMatch, fixture });
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await fetchAllMatches();
      setApiList(data);
    } catch { /* keep stale */ }
  }, []);

  useEffect(() => { load(); }, [load]);
  // Auto-refresh every 30s when there are live matches
  const hasLive = liveMatches.some((m) => isLiveStatus(m.status));
  useInterval(load, hasLive ? 30_000 : 5 * 60_000);

  // Merge live matches into apiList for the card lookup
  const mergedApiList = useMemo(() => {
    const ids = new Set(liveMatches.map((m) => m.id));
    return [...liveMatches, ...apiList.filter((m) => !ids.has(m.id))];
  }, [liveMatches, apiList]);

  const visibleFixtures = useMemo(() => {
    if (!selectedDate) return ENRICHED_FIXTURES;
    return ENRICHED_FIXTURES.filter((f) => f.localDate === selectedDate);
  }, [selectedDate]);

  // Sort: live first, then finished, then upcoming
  const sortedFixtures = useMemo(() => {
    return [...visibleFixtures].sort((a, b) => {
      const aMatch = findApiMatch(a, mergedApiList);
      const bMatch = findApiMatch(b, mergedApiList);
      const aLive = aMatch ? isLiveStatus(aMatch.status) : false;
      const bLive = bMatch ? isLiveStatus(bMatch.status) : false;
      const aFin  = aMatch ? isFinishedStatus(aMatch.status) : false;
      const bFin  = bMatch ? isFinishedStatus(bMatch.status) : false;
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;
      if (aFin && !bFin) return 1;
      if (!aFin && bFin) return -1;
      return a.matchNum - b.matchNum;
    });
  }, [visibleFixtures, mergedApiList]);

  const byStage = useMemo(() => {
    const map = new Map<string, Map<string, StaticMatch[]>>();
    for (const stage of STAGE_ORDER) map.set(stage, new Map());
    for (const f of sortedFixtures) {
      if (!map.has(String(f.stage ?? ''))) map.set(String(f.stage ?? ''), new Map());
    const key = f.group || String(f.stage ?? '');
const sm = map.get(String(f.stage ?? ''))!;
      if (!sm.has(key)) sm.set(key, []);
      sm.get(key)!.push(f);
    }
    return map;
  }, [sortedFixtures]);

  const liveCount = liveMatches.filter((m) => isLiveStatus(m.status)).length;

  return (
    <div>
      {modalItem && (
        <MatchDetailModal
          matchId={modalItem.apiMatch?.id ?? null}
          staticInfo={{
            home:      modalItem.fixture.home,
            homeFlag:  modalItem.fixture.homeFlag,
            away:      modalItem.fixture.away,
            awayFlag:  modalItem.fixture.awayFlag,
            date:      modalItem.fixture.date,
            timeET:    modalItem.fixture.localTime,
            stadium:   modalItem.fixture.stadium,
            city:      modalItem.fixture.city,
            stage:     modalItem.fixture.stage,
            group:     modalItem.fixture.group,
            matchNum:  modalItem.fixture.matchNum,
          }}
          apiMatch={modalItem.apiMatch}
          onClose={() => setModalItem(null)}
        />
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-1.5 self-stretch" style={{ background: 'linear-gradient(180deg,#E3000B,#0057A8)', minHeight: 48 }} />
          <div>
            <h2 className="font-anton text-white uppercase tracking-wider leading-none" style={{ fontSize: 'clamp(28px, 5vw, 56px)' }}>
              FULL SCHEDULE
            </h2>
            <p className="font-inter text-gray-600 text-xs font-semibold tracking-widest uppercase mt-1">
              104 MATCHES · 12 GROUPS
            </p>
          </div>
        </div>
        {liveCount > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 self-start sm:self-auto" style={{ backgroundColor: '#E3000B' }}>
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="font-anton text-white text-xs tracking-widest">{liveCount} LIVE</span>
          </span>
        )}
      </div>

      {/* Live strip */}
      <LiveStrip liveMatches={liveMatches} />

      {/* Date scroll bar */}
      <div className="mb-8" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div className="flex gap-2 pb-2" style={{ minWidth: 'max-content' }}>
          {ALL_DATES.map((iso) => {
            const isActive  = selectedDate === iso;
            const isToday   = iso === TODAY_ISO;
            const stageHex  = STAGE_HEX[DATE_STAGE_LABEL[iso] ?? 'Group Stage'] ?? '#333';
            const { top, bottom } = formatDateBtn(iso);
            return (
              <button
                key={iso}
                onClick={() => setSelectedDate(iso)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '8px 12px', minWidth: 52,
                  border: isActive ? `2px solid ${isToday ? '#E8192C' : stageHex}` : '2px solid rgba(255,255,255,0.08)',
                  backgroundColor: isActive ? (isToday ? '#E8192C' : stageHex) : 'rgba(255,255,255,0.04)',
                  cursor: 'pointer', transition: 'background-color 0.15s, border-color 0.15s',
                  outline: 'none',
                  boxShadow: isActive ? `0 0 12px ${isToday ? '#E8192C' : stageHex}66` : 'none',
                }}
              >
                <span style={{ color: isActive ? '#ffffff' : '#9ca3af', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1 }}>
                  {top}
                </span>
                <span style={{ color: '#ffffff', fontSize: 18, fontWeight: 900, lineHeight: 1.1, marginTop: 2, fontFamily: 'inherit' }}>
                  {bottom}
                </span>
                {isToday && (
                  <span style={{ fontSize: 8, color: isActive ? '#fff' : '#E8192C', fontWeight: 700, letterSpacing: '0.05em', marginTop: 2 }}>
                    TODAY
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex gap-3 mt-3 flex-wrap">
          {Object.entries(STAGE_HEX).map(([stage, hex]) => (
            <div key={stage} className="flex items-center gap-1.5">
              <div style={{ width: 8, height: 8, backgroundColor: hex, flexShrink: 0 }} />
              <span style={{ color: '#555', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{stage}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stages */}
      <div className="space-y-10">
        {STAGE_ORDER.filter((s) => (byStage.get(s)?.size ?? 0) > 0).map((stage) => {
          const stageMap = byStage.get(stage)!;
          const isFinal  = stage === 'Final';
          const accentHex = STAGE_HEX[stage] ?? '#555555';

          return (
            <div key={stage}>
              <div
                className="px-5 py-3 mb-4 flex items-center justify-between"
                style={{ backgroundColor: accentHex }}
              >
                <h3
                  className="font-anton text-white tracking-[0.2em] uppercase leading-none"
                  style={{ fontSize: 'clamp(18px, 3vw, 32px)' }}
                >
                 {isFinal ? 'FINAL · July 19, 2026' : String(stage ?? '').toUpperCase()}
                </h3>
                {isFinal && (
                  <span className="font-inter text-white text-xs font-bold opacity-80">
                    MetLife Stadium, New Jersey
                  </span>
                )}
              </div>

              {stage === 'Group Stage' ? (
                <div className="space-y-6">
                  {Array.from(stageMap.entries()).map(([groupKey, fixtures]) => (
                    <div key={groupKey}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="px-3 py-1" style={{ backgroundColor: accentHex }}>
                          <span className="font-anton text-white text-xs tracking-[0.3em]">GROUP {groupKey}</span>
                        </div>
                        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
                        <span className="font-inter text-xs text-gray-600 font-semibold">{fixtures.length} matches</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {fixtures.map((f) => (
                          <MatchCard key={f.matchNum} fixture={f} liveList={liveMatches} apiList={mergedApiList} accentHex={accentHex} onMatchClick={handleMatchClick} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`grid gap-3 ${isFinal ? 'grid-cols-1 max-w-sm mx-auto' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                  {Array.from(stageMap.values()).flat().map((f) => (
                    <MatchCard key={f.matchNum} fixture={f} liveList={liveMatches} apiList={mergedApiList} isFinal={isFinal} accentHex={accentHex} onMatchClick={handleMatchClick} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
