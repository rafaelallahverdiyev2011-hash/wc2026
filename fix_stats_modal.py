with open('src/services/footballData.ts', encoding='utf-8') as f:
    content = f.read()

# Export HARDCODED_STATS
old = "export const HARDCODED_STATS: Record<string, import(\"./footballData\").MatchStatItem[]> = {"
new = "export const HARDCODED_STATS: Record<string, MatchStatItem[]> = {"

if old in content:
    content = content.replace(old, new, 1)
    with open('src/services/footballData.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Step 1: fixed type reference')
else:
    print('ERROR step 1')

with open('src/components/MatchDetailModal.tsx', encoding='utf-8') as f:
    content2 = f.read()

# Add import
old2 = "  HARDCODED_LINEUPS,"
new2 = "  HARDCODED_LINEUPS,\n  HARDCODED_STATS,"

if old2 in content2:
    content2 = content2.replace(old2, new2, 1)
    print('Step 2: import added')
else:
    print('ERROR step 2')

# Find fetchMatchStats usage and add hardcode check
old3 = "export async function fetchMatchStats"
# Find in footballData
idx = content.find(old3)
print('fetchMatchStats at line:', content[:idx].count('\n') + 1 if idx != -1 else 'not found')

with open('src/components/MatchDetailModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content2)
