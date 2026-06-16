with open('src/App.tsx', encoding='utf-8') as f:
    content = f.read()

# Add import
content = content.replace(
    "import ScheduleTab from './components/ScheduleTab';",
    "import ScheduleTab from './components/ScheduleTab';\nimport PredictTab from './components/PredictTab';"
)

# Add tab to TABS array
content = content.replace(
    "  { id: 'knockout', label: 'BRACKET'  },",
    "  { id: 'knockout', label: 'BRACKET'  },\n  { id: 'predict',  label: 'PREDICT'  },"
)

# Add tab render
content = content.replace(
    "{activeTab === 'knockout' && <KnockoutTab liveMatches={liveMatches} />}",
    "{activeTab === 'knockout' && <KnockoutTab liveMatches={liveMatches} />}\n        {activeTab === 'predict'  && <PredictTab />}"
)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
