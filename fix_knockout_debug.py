with open('src/services/footballData.ts', encoding='utf-8') as f:
    content = f.read()

old = "    const apiKnockout = knockoutData ? parseDrawMatches(knockoutData, {}) : [];"
new = """    console.log('[WC API] KNOCKOUT RAW:', JSON.stringify(knockoutData, null, 2));
    const apiKnockout = knockoutData ? parseDrawMatches(knockoutData, {}) : [];
    console.log('[WC API] KNOCKOUT PARSED:', apiKnockout.length, 'matches');"""

if old in content:
    content = content.replace(old, new)
    with open('src/services/footballData.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done')
else:
    print('ERROR: marker not found')
