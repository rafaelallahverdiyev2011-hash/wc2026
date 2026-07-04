with open('src/components/MatchDetailModal.tsx', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    new_lines.append(line)
    if 'fetchMatchStats(matchId).then' in line:
        # Find the closing }); and replace the whole block
        # Insert hardcode check before fetchMatchStats call
        new_lines.pop()  # remove the fetchMatchStats line
        new_lines.append('    const homeName = match?.homeTeam?.name ?? info?.home ?? \'\';\n')
        new_lines.append('    const awayName = match?.awayTeam?.name ?? info?.away ?? \'\';\n')
        new_lines.append('    const hcStatsKey = `${homeName}_${awayName}`;\n')
        new_lines.append('    if (HARDCODED_STATS[hcStatsKey]) {\n')
        new_lines.append('      setStats(HARDCODED_STATS[hcStatsKey]);\n')
        new_lines.append('      setLoading(false);\n')
        new_lines.append('    } else {\n')
        new_lines.append('    ' + line)  # original fetchMatchStats line
        # Add closing brace after the .then block
        # Read ahead to find });
        i += 1
        while i < len(lines):
            new_lines.append(lines[i])
            if '});' in lines[i] and 'fetchMatchStats' not in lines[i]:
                new_lines.append('    }\n')
                break
            i += 1
    i += 1

with open('src/components/MatchDetailModal.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print('Done')
