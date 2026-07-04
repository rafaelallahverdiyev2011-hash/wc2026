with open('src/components/ScheduleTab.tsx', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    new_lines.append(line)
    # After the isLive line, inject hardcode logic
    if 'const isLive' in line and 'liveMatch !== null' in line:
        new_lines.append('  const hcKey = `${fixture.home}_${fixture.away}`;\n')
        new_lines.append('  const hc = HARDCODED_RESULTS[hcKey] ?? null;\n')
    # Replace isFinished line
    if 'const isFinished' in line and 'isFinishedStatus' in line:
        new_lines.pop()  # remove line we just added
        new_lines.append('  const isFinished = !isLive && (apiMatch != null && isFinishedStatus(apiMatch.status) || (hc !== null && apiMatch === null));\n')
    # Replace _hs line
    if 'const _hs' in line and 'score.fullTime.home' in line:
        new_lines.pop()
        new_lines.append('  const _hs = liveMatch?.score.fullTime.home ?? apiMatch?.score.fullTime.home ?? hc?.home ?? null;\n')
    # Replace _as line
    if 'const _as' in line and 'score.fullTime.away' in line:
        new_lines.pop()
        new_lines.append('  const _as = liveMatch?.score.fullTime.away ?? apiMatch?.score.fullTime.away ?? hc?.away ?? null;\n')
    i += 1

with open('src/components/ScheduleTab.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print('Done')
