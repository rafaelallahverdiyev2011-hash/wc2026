with open('src/services/footballData.ts', encoding='utf-8') as f:
    content = f.read()

# Find second occurrence and remove it
first = content.find('export const HARDCODED_LINEUPS')
second = content.find('export const HARDCODED_LINEUPS', first + 1)

if second == -1:
    print('No duplicate found')
else:
    # Find end of second declaration (closing };)
    end = content.find('\n};', second)
    if end != -1:
        content = content[:second] + content[end+3:]
        with open('src/services/footballData.ts', 'w', encoding='utf-8') as f:
            f.write(content)
        print('Done - removed duplicate')
    else:
        print('ERROR: could not find end of duplicate')
