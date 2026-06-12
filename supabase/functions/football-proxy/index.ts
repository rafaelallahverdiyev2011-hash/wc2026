import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RAPIDAPI_HOST = 'world-cup-2026-live-api.p.rapidapi.com';
const RAPIDAPI_KEY  = Deno.env.get('RAPIDAPI_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // Accept ?path=/wc/matches or legacy ?endpoint=...
    const path = url.searchParams.get('path') ?? url.searchParams.get('endpoint');

    if (!path) {
      return new Response(
        JSON.stringify({ error: 'Missing path parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const forwardParams = new URLSearchParams();
    for (const [k, v] of url.searchParams.entries()) {
      if (k !== 'path' && k !== 'endpoint') forwardParams.set(k, v);
    }

    const [cleanPath, inlineQuery] = path.split('?');
    const allParams = new URLSearchParams(inlineQuery ?? '');
    for (const [k, v] of forwardParams.entries()) allParams.set(k, v);

    const queryStr = allParams.toString();
    const apiUrl = `https://${RAPIDAPI_HOST}${cleanPath}${queryStr ? `?${queryStr}` : ''}`;

    const response = await fetch(apiUrl, {
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: 'Proxy error', message: error?.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
