import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

const openAiEmbeddingsUrl = "https://api.openai.com/v1/embeddings";
const fetchBatchSize = 200;
const embeddingBatchSize = 50;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

function buildEmbeddingInput(document) {
  return [document.title, document.eval_reason].map((value) => String(value ?? "").trim()).filter(Boolean).join("\n\n");
}

async function requireAdminUser(req, supabaseUrl, supabaseAnonKey, adminEmail) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) {
    throw new Error("Missing authorization header.");
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authorization
      }
    }
  });

  const { data, error } = await userClient.auth.getUser();
  if (error) {
    throw new Error(error.message);
  }

  const email = data.user?.email ?? "";
  if (!email || email !== adminEmail) {
    throw new Error("Forbidden");
  }
}

async function createEmbeddingVectors(openAiApiKey, inputs) {
  const embeddingResponse = await fetch(openAiEmbeddingsUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiApiKey}`
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: inputs
    })
  });

  const embeddingPayload = await embeddingResponse.json();
  if (!embeddingResponse.ok) {
    throw new Error(embeddingPayload?.error?.message ?? "Embedding request failed.");
  }

  const vectors = (embeddingPayload?.data || []).map((item) => item.embedding);
  if (!Array.isArray(vectors) || vectors.some((vector) => !Array.isArray(vector))) {
    throw new Error("Embedding vector missing from response.");
  }

  return vectors;
}

async function fetchUnembeddedBadDocuments(supabase) {
  const documents = [];
  let from = 0;
  let skippedCount = 0;

  while (true) {
    const { data, error } = await supabase
      .from("scrapped_document")
      .select("id, title, subject, eval_reason")
      .eq("good_bad_type", "BAD")
      .order("id", { ascending: true })
      .range(from, from + fetchBatchSize - 1);

    if (error) {
      throw error;
    }

    const rows = data || [];
    if (!rows.length) {
      break;
    }

    const ids = rows.map((row) => row.id);
    const { data: embeddedRows, error: embeddedError } = await supabase
      .from("bad_document_embedding")
      .select("scrapped_document_id")
      .in("scrapped_document_id", ids);

    if (embeddedError) {
      throw embeddedError;
    }

    const embeddedIds = new Set((embeddedRows || []).map((row) => Number(row.scrapped_document_id)));

    for (const row of rows) {
      if (embeddedIds.has(Number(row.id))) {
        continue;
      }

      const hasReason = String(row.eval_reason ?? "").trim();
      if (!hasReason) {
        skippedCount += 1;
        continue;
      }

      documents.push({
        scrapped_document_id: Number(row.id),
        title: row.title || row.subject || "",
        eval_reason: hasReason
      });
    }

    if (rows.length < fetchBatchSize) {
      break;
    }

    from += fetchBatchSize;
  }

  return { documents, skippedCount };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const adminEmail = Deno.env.get("ADMIN_EMAIL");

    if (!openAiApiKey || !supabaseAnonKey || !supabaseUrl || !supabaseServiceRoleKey || !adminEmail) {
      return jsonResponse({ error: "Missing required function secrets." }, 500);
    }

    await requireAdminUser(req, supabaseUrl, supabaseAnonKey, adminEmail);

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { documents, skippedCount } = await fetchUnembeddedBadDocuments(supabase);
    if (!documents.length) {
      return jsonResponse({
        results: [],
        success_count: 0,
        failure_count: 0,
        skipped_count: skippedCount
      });
    }

    const results = [];

    for (let index = 0; index < documents.length; index += embeddingBatchSize) {
      const chunk = documents.slice(index, index + embeddingBatchSize);
      const normalizedChunk = chunk.map((document) => ({
        scrapped_document_id: Number(document?.scrapped_document_id),
        embedding_input: buildEmbeddingInput(document)
      }));

      const invalidDocuments = normalizedChunk.filter((document) => !document.scrapped_document_id || !document.embedding_input);
      if (invalidDocuments.length) {
        invalidDocuments.forEach((document) => {
          results.push({
            scrapped_document_id: document.scrapped_document_id || null,
            ok: false,
            error: "Missing required fields."
          });
        });
        continue;
      }

      try {
        const embeddingVectors = await createEmbeddingVectors(
          openAiApiKey,
          normalizedChunk.map((document) => document.embedding_input)
        );
        const updatedAt = new Date().toISOString();
        const rows = normalizedChunk.map((document, chunkIndex) => ({
          scrapped_document_id: document.scrapped_document_id,
          embedding_input: document.embedding_input,
          embedding_vector: embeddingVectors[chunkIndex],
          updated_at: updatedAt
        }));

        const { error } = await supabase.from("bad_document_embedding").upsert(rows, {
          onConflict: "scrapped_document_id"
        });

        if (error) {
          normalizedChunk.forEach((document) => {
            results.push({
              scrapped_document_id: document.scrapped_document_id,
              ok: false,
              error: error.message
            });
          });
          continue;
        }

        normalizedChunk.forEach((document) => {
          results.push({
            scrapped_document_id: document.scrapped_document_id,
            ok: true
          });
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        normalizedChunk.forEach((document) => {
          results.push({
            scrapped_document_id: document.scrapped_document_id,
            ok: false,
            error: message
          });
        });
      }
    }

    const failureCount = results.filter((item) => !item.ok).length;
    const successCount = results.length - failureCount;

    return jsonResponse({
      results,
      success_count: successCount,
      failure_count: failureCount,
      skipped_count: skippedCount
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message === "Forbidden" || message === "Missing authorization header." ? 403 : 500;
    return jsonResponse({ error: message }, status);
  }
});
