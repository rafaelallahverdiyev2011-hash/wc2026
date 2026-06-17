with open('src/services/footballData.ts', encoding='utf-8') as f:
    lines = f.readlines()
# Remove line 716 (index 715) which has extra }
del lines[715]
with open('src/services/footballData.ts', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')
