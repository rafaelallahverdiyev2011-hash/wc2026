with open('src/services/footballData.ts', encoding='utf-8') as f:
    content = f.read()

old = """function parseCommentaryResponse(data: unknown): CommentaryEvent[] {
  if (!data || typeof data !== 'object') return [];
  const d = data as Record<string, unknown>;
  const arr =
    Array.isArray(d.commentary) ? d.commentary :
    Array.isArray(d.events)     ? d.events     :
    Array.isArray(d.data)       ? d.data       :
    Array.isArray(data)         ? (data as unknown[]) : [];
  return arr.map((e: unknown) => {
    const ev = (e ?? {}) as Record<string, unknown>;
    return {
      minute: String(ev.minute ?? ev.time ?? ev.min ?? ''),
      type:   String(ev.type ?? ev.event ?? ev.category ?? '').toLowerCase(),
      text:   String(ev.text ?? ev.comment ?? ev.description ?? ev.detail ?? ''),
    };
  }).filter(e => e.text || e.minute);
}"""

new = """function parseCommentaryResponse(data: unknown): CommentaryEvent[] {
  if (!data || typeof data !== 'object') return [];
  const d = data as Record<string, unknown>;
  const inner = (d.data ?? d) as Record<string, unknown>;
  const incidents = Array.isArray(inner.incidents) ? inner.incidents : [];
  if (incidents.length > 0) {
    return incidents.map((e: unknown) => {
      const ev = (e ?? {}) as Record<string, unknown>;
      return {
        minute: String(ev.minute ?? ''),
        type:   String(ev.type ?? '').toLowerCase(),
        text:   String(ev.text ?? ev.player ?? ''),
      };
    }).filter((e: CommentaryEvent) => e.minute || e.text);
  }
  const arr =
    Array.isArray(d.commentary) ? d.commentary :
    Array.isArray(d.events)     ? d.events     :
    Array.isArray(d.data)       ? d.data       :
    Array.isArray(data)         ? (data as unknown[]) : [];
  return arr.map((e: unknown) => {
    const ev = (e ?? {}) as Record<string, unknown>;
    return {
      minute: String(ev.minute ?? ev.time ?? ev.min ?? ''),
      type:   String(ev.type ?? ev.event ?? ev.category ?? '').toLowerCase(),
      text:   String(ev.text ?? ev.comment ?? ev.description ?? ev.detail ?? ''),
    };
  }).filter(e => e.text || e.minute);
}"""

if old in content:
    content = content.replace(old, new)
    with open('src/services/footballData.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done')
else:
    print('ERROR: marker not found')
