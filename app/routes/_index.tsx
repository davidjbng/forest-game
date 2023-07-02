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

  return (
    <main className="text-lg p-3 pt-[20vh] pb-[50vh] grid place-items-center min-h-full">
      <div className="max-w-[60ch] w-full">
        <h1 className="text-3xl">
          You are in a Forest <span className="text-green-700">~ Get Out</span>
        </h1>
        <ul className="py-2">
          {context?.map((item) =>
            item.role === "user" ? (
              <li key={item.content} className="text-gray-500">
                {item.content}
              </li>
            ) : (
              <li key={item.content} className="text-green-700">
                {item.content}
              </li>
            )
          )}
          {navigation.formData && (
            <li className="text-gray-500">
              {navigation.formData.get("command") as string}
            </li>
          )}
          {isPending && <li className="text-gray-500 animate-pulse">...</li>}
        </ul>
        <Form method="POST" ref={formRef} className="py-2" autoComplete="off">
          <input
            type="text"
            name="command"
            autoFocus
            disabled={isPending}
            className="w-full"
          />
          <input type="hidden" name="context" value={JSON.stringify(context)} />
        </Form>
      </div>
    </main>
  );
}
