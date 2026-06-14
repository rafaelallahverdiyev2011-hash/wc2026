content = open('src/components/ScheduleTab.tsx', encoding='utf-8').read()
lines = content.split('\n')
new_lines = []
skip = False
for i, line in enumerate(lines):
    if i == 183:
        skip = True
    if skip and line.strip() == '];':
        skip = False
        new_lines.append(line)
        continue
    if not skip:
        new_lines.append(line)
result = '\n'.join(new_lines)
open('src/components/ScheduleTab.tsx', 'w', encoding='utf-8').write(result)
print('Done')
