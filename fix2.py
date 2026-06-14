with open('src/components/ScheduleTab.tsx', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if 'cd ~/Desktop/wc2026' in line:
        skip = True
    if skip and line.strip() == '];':
        skip = False
        new_lines.append(line)
        continue
    if not skip:
        new_lines.append(line)

with open('src/components/ScheduleTab.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print(f'Done. Total lines: {len(new_lines)}')
