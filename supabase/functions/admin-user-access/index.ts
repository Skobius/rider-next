import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.111.0';

type Action = 'block' | 'unblock';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse(405, { error: 'method_not_allowed' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authHeader = request.headers.get('Authorization') ?? '';

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse(500, { error: 'server_not_configured' });
  }
  if (!authHeader.startsWith('Bearer ')) {
    return jsonResponse(401, { error: 'missing_session' });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return jsonResponse(401, { error: 'invalid_session' });

  const { data: isSuperadmin, error: roleError } = await userClient.rpc('is_superadmin', {
    check_user_id: userData.user.id,
  });
  if (roleError || isSuperadmin !== true) return jsonResponse(403, { error: 'forbidden' });

  let body: { action?: Action; targetUserId?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: 'invalid_json' });
  }

  const action = body.action;
  const targetUserId = body.targetUserId;
  if ((action !== 'block' && action !== 'unblock') || !targetUserId) {
    return jsonResponse(400, { error: 'invalid_request' });
  }

  const { data: targetProfile, error: targetError } = await serviceClient
    .from('profiles')
    .select('id, account_status')
    .eq('id', targetUserId)
    .maybeSingle();
  if (targetError) return jsonResponse(500, { error: 'target_lookup_failed' });
  if (!targetProfile) return jsonResponse(404, { error: 'target_not_found' });

  const rpcName = action === 'block' ? 'block_user' : 'unblock_user';
  const banDuration = action === 'block' ? '876000h' : 'none';

  const { error: authUpdateError } = await serviceClient.auth.admin.updateUserById(targetUserId, {
    ban_duration: banDuration,
  });
  if (authUpdateError) return jsonResponse(500, { error: 'auth_update_failed' });

  const { error: rpcError } = await userClient.rpc(rpcName, { target_user_id: targetUserId });
  if (rpcError) {
    const rollbackDuration = action === 'block' ? 'none' : '876000h';
    await serviceClient.auth.admin.updateUserById(targetUserId, { ban_duration: rollbackDuration });
    return jsonResponse(400, { error: 'profile_update_failed' });
  }

  return jsonResponse(200, { ok: true, action, targetUserId });
});
