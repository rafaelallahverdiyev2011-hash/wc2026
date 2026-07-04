with open('src/components/MatchDetailModal.tsx', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "tab === 'stats' && matchId ?" in line:
        line = line.replace("tab === 'stats' && matchId ?", "tab === 'stats' && (matchId || staticInfo) ?")
    new_lines.append(line)

with open('src/components/MatchDetailModal.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print('Done')
