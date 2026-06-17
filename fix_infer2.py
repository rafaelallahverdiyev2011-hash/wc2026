with open('src/services/footballData.ts', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if '// If score is still null but teams have played, infer from standings' in line:
        skip = True
    if skip and line.strip() == '}':
        skip = False
        continue
    if not skip:
        new_lines.append(line)

with open('src/services/footballData.ts', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print(f'Done. Lines: {len(new_lines)}')
