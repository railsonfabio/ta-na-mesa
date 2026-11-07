import { subscribeToDb, getDb, AppDatabaseState } from "../../../lib/server-db";

export async function GET(req: Request) {
  const encoder = new TextEncoder();

  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection state
      const initial = getDb();
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "INIT", state: initial })}\n\n`)
      );

      // Subscribe to real-time database modifications
      cleanup = subscribeToDb((state: AppDatabaseState, notification?: string) => {
        try {
          const payload = JSON.stringify({
            type: "STATE_UPDATE",
            state,
            notification,
          });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch {
          // Stream error or disconnect
        }
      });
    },
    cancel() {
      if (cleanup) cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
