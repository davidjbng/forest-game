import { type ActionArgs, type V2_MetaFunction } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { getCompletion, ChatCompletionMesssage } from "./.ai-completion.server";

export const meta: V2_MetaFunction = () => {
  return [
    { title: "Forest ~ Get Out" },
    { name: "description", content: "A text based escape game" },
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
  const actionData = useActionData<typeof action>();
  const isPending =
    navigation.state === "submitting" || navigation.state === "loading";

  useEffect(() => {
    if (isPending) {
      formRef.current?.reset();
    } else {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
      formRef.current?.command.focus();
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

  const messagePairs = toPairs(context);

  return (
    <main className="text-lg p-3 pt-[20vh] pb-[50vh] grid place-items-center min-h-full">
      <div className="max-w-[60ch] w-full">
        <h1 className="text-3xl sticky top-3">
          You wake up in a Forest{" "}
          <span className="text-green-700">~ Get Out</span>
        </h1>
        <ul className="py-2 snap-x">
          {messagePairs.map(([first, second], index) => {
            const isLast = index === messagePairs.length - 1;
            return (
              <li
                key={first.content}
                className="min-h-screen snap-start snap-normal"
              >
                <p className="text-gray-500">{first.content}</p>
                {second && <p className="text-green-700">{second.content}</p>}
                {isLast && (
                  <Form
                    method="POST"
                    ref={formRef}
                    className="py-2"
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
          })}
          {/* {navigation.formData && (
            <li className="text-gray-500">
              {navigation.formData.get("command") as string}
            </li>
          )}
          {isPending && <li className="text-gray-500 animate-pulse">...</li>} */}
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
