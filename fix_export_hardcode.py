with open('src/services/footballData.ts', encoding='utf-8') as f:
    content = f.read()

old = "const HARDCODED_RESULTS: Record<string, { home: number; away: number }> = {"
new = "export const HARDCODED_RESULTS: Record<string, { home: number; away: number }> = {"

if old in content:
    content = content.replace(old, new, 1)
    print('Done')
else:
    print('ERROR: marker not found')

with open('src/services/footballData.ts', 'w', encoding='utf-8') as f:
    f.write(content)
