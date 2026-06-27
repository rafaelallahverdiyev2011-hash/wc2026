with open('src/services/footballData.ts', encoding='utf-8') as f:
    content = f.read()
old = "function toFDMatch(raw: RawMatch): FDMatch {"
new = """function toFDMatch(raw: RawMatch): FDMatch {
  console.log('RAW MATCH DEBUG:', JSON.stringify(raw, null, 2));"""
if old in content:
    content = content.replace(old, new, 1)
    with open('src/services/footballData.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done')
else:
    print('ERROR: marker not found')
