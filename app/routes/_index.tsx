import { type ActionArgs, type V2_MetaFunction } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { getCompletion, ChatCompletionMesssage } from "./.ai-completion.server";

export const meta: V2_MetaFunction = () => {
  return [
    { title: "Forest Game" },
    {
      name: "description",
      content:
        "You wake up in a forest ~ Get Out. A text based adventure game.",
    },
  ];
};

export async function action({ request }: ActionArgs) {
  const data = await request.formData();

  const command = data.get("command") as string;
  const parsedContext = JSON.parse(
    data.get("context") as string
  ) as ChatCompletionMesssage[];

  const response = await getCompletion(command, parsedContext);

  let newContext: ChatCompletionMesssage[] = [];
  if (response.success) {
    newContext.push(
      { role: "user", content: command },
      { role: "assistant", content: response.message }
    );
  } else {
    newContext.push(
      { role: "user", content: "***" },
      {
        role: "assistant",
        content: "Failed to process your command. Please try again.",
      }
    );
  }
  return {
    context: [...parsedContext, ...newContext],
  };
}

export default function Index() {
  const navigation = useNavigation();
  const formRef = useRef<HTMLFormElement>(null);
  const lastPanelRef = useRef<HTMLLIElement>(null);
  const actionData = useActionData<typeof action>();
  const isPending =
    navigation.state === "submitting" || navigation.state === "loading";

  useEffect(() => {
    if (isPending) {
      formRef.current?.reset();
    } else {
      lastPanelRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isPending]);

  const [context, setContext] = useState<ChatCompletionMesssage[]>(
    actionData?.context ?? []
  );

  useEffect(() => {
    if (actionData?.context) {
      setContext(actionData.context);
      window.sessionStorage.setItem(
        "context",
        JSON.stringify(actionData.context)
      );
    } else if (window?.sessionStorage.getItem("context")) {
      setContext(JSON.parse(window.sessionStorage.getItem("context") ?? "[]"));
    }
  }, [actionData]);

  function reset() {
    setContext([]);
    window.sessionStorage.removeItem("context");
  }

  return (
    <main className="text-lg grid place-items-center min-h-full">
      <div className="max-w-[60ch] w-full relative">
        <header className="sticky left-0 right-0 top-3 px-2 flex justify-between">
          <h1 className="text-3xl">Forest Game</h1>
          <button className="ml-auto" onClick={reset}>
            Reset
          </button>
        </header>
        <ul>
          {context.length ? (
            toPairs(context).map(([first, second], index, arr) => {
              const isLast = index === arr.length - 1;
              return (
                <li
                  key={first.content + (second?.content ?? "")}
                  ref={isLast ? lastPanelRef : undefined}
                  className={`h-d-screen flex flex-col pt-[20vh] px-2 snap-start snap-normal ${
                    index % 2 === 0 ? "bg-gray-300" : "bg-amber-100"
                  }`}
                >
                  <p className="text-gray-500">{first.content}</p>
                  {second && <p className="text-green-700">{second.content}</p>}
                  {isLast && (
                    <Form
                      method="POST"
                      ref={formRef}
                      className="py-2 mt-auto"
                      autoComplete="off"
                    >
                      <input
                        type="text"
                        name="command"
                        autoFocus
                        disabled={isPending}
                        className="w-full"
                      />
                      <input
                        type="hidden"
                        name="context"
                        value={JSON.stringify(context)}
                      />
                    </Form>
                  )}
                </li>
              );
            })
          ) : (
            <div className="h-d-screen flex flex-col pt-[20vh] px-2">
              <Form
                method="POST"
                ref={formRef}
                className="py-2 mt-auto"
                autoComplete="off"
              >
                <input
                  type="text"
                  name="command"
                  autoFocus
                  disabled={isPending}
                  className="w-full"
                />
                <input
                  type="hidden"
                  name="context"
                  value={JSON.stringify(context)}
                />
              </Form>
            </div>
          )}
        </ul>
      </div>
    </main>
  );
}

function* chunked<T>(inputArray: T[], chunkSize: number): Generator<T[]> {
  for (
    let index = 0;
    index + chunkSize <= inputArray.length;
    index += chunkSize
  ) {
    yield inputArray.slice(index, index + chunkSize);
  }
}

function toPairs<T>(inputArray: T[]): [T, T | undefined][] {
  //compute the entire sequence of windows into an array
  return Array.from(chunked(inputArray, 2)) as [T, T | undefined][];
}
