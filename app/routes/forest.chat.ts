import type { LoaderArgs } from "@remix-run/node";
import { getCompletion } from "~/completion.server";
import { events } from "~/events.server";

export async function loader({ request }: LoaderArgs) {
  return new Response(
    new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        async function handleCommand(command: string, context: any) {
          const completion = await getCompletion(command, context);
          if (!completion.success) {
            console.error("completion failed", completion);
            return;
          }

          for await (const chunk of completion.message) {
            if (request.signal.aborted) {
              completion.message.controller.abort();
              return;
            }
            controller.enqueue(encoder.encode("event: message\n"));
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
            );
          }

          controller.close();
        }

        let closed = false;
        function close() {
          if (closed) return;
          closed = true;
          events.removeListener("command", handleCommand);
          request.signal.removeEventListener("abort", close);
          controller.close();
        }

        events.addListener("command", handleCommand);
        request.signal.addEventListener("abort", close);
        if (request.signal.aborted) {
          controller.close();
          return;
        }
      },
    }),
    {
      headers: { "Content-Type": "text/event-stream" },
    }
  );
}
