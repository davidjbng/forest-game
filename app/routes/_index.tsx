import { json, type ActionArgs, type V2_MetaFunction } from "@remix-run/node";
import { useNavigation, Form, useSubmit } from "@remix-run/react";
import type { ChatCompletionChunk } from "openai/resources/chat";
import { useEffect, useState } from "react";
import { type ChatCompletionMessage } from "~/completion.server";
import { dispatchCommand } from "~/events.server";

export const meta: V2_MetaFunction = () => {
  return [
    { title: "Forest ~ Get Out" },
    { name: "description", content: "A text based escape game" },
  ];
};

export async function action({ request }: ActionArgs) {
  const data = await request.formData();

  const command = data.get("command") as string;
  const parsedContext: ChatCompletionMessage[] = JSON.parse(
    (data.get("context") as string) ?? "[]"
  );

  dispatchCommand(command, parsedContext);

  return json(null, { status: 202 });
}

function useChatCompletionStream(key: number) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const eventSource = new EventSource("/forest/chat");
    const concatMessage = (event: MessageEvent) => {
      try {
        const chunk = JSON.parse(event.data) as ChatCompletionChunk;
        console.log("chunk", chunk);
        const message = chunk.choices[0]?.delta?.content;
        if (message && chunk.choices[0]?.finish_reason == null) {
          setMessage((m) => m.concat(message));
        } else if (chunk.choices[0]?.finish_reason === "stop") {
          eventSource.close();
        }
      } catch (e) {
        console.error(e);
      }
    };
    eventSource.addEventListener("message", concatMessage);

    return () => {
      eventSource.close();
      eventSource.removeEventListener("message", concatMessage);
    };
  }, [key]);

  return { message, resetMessage: () => setMessage("") };
}

export default function Index() {
  const navigation = useNavigation();
  const isPending =
    navigation.state === "submitting" || navigation.state === "loading";

  const [key, setKey] = useState(0);
  const { message, resetMessage } = useChatCompletionStream(key);
  const [context, setContext] = useState<
    Array<ChatCompletionMessage & { id: string }>
  >([]);
  const submit = useSubmit();

  function submitCommand(form: HTMLFormElement) {
    setKey((k) => k + 1);
    const formData = new FormData(form);
    submit(form, { method: "post" });
    form.reset();
    setContext((current) =>
      current.concat(
        { role: "assistant", content: message, id: crypto.randomUUID() },
        {
          role: "user",
          content: formData.get("command") as string,
          id: crypto.randomUUID(),
        }
      )
    );
    resetMessage();
  }

  return (
    <main className="text-lg p-3 pt-[20vh] pb-[50vh] grid place-items-center min-h-full">
      <div className="max-w-[60ch] w-full">
        <h1 className="text-3xl">
          You are in a Forest <span className="text-green-700">~ Get Out</span>
        </h1>
        <ul className="py-2">
          {context.map((item) =>
            item.role === "user" ? (
              <li key={item.id} className="text-gray-500">
                {item.content}
              </li>
            ) : (
              <li key={item.id} className="text-green-700">
                {item.content}
              </li>
            )
          )}
          {message && <li className="text-green-700">{message}</li>}
        </ul>
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            submitCommand(event.currentTarget);
          }}
          className="py-2"
          autoComplete="off"
        >
          <input
            type="text"
            name="command"
            autoFocus
            disabled={isPending}
            className="w-full"
            required
          />
          <input
            type="hidden"
            name="context"
            value={JSON.stringify(
              context.map((c) => ({ role: c.role, content: c.content }))
            )}
          />
        </Form>
      </div>
    </main>
  );
}
