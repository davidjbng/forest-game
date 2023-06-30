import type { ActionArgs, V2_MetaFunction } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { ChatCompletionRequestMessage } from "openai";
import { useEffect, useRef } from "react";
import { getCompletion } from "./ai-complection.server";

export const meta: V2_MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export async function action({ request }: ActionArgs) {
  const data = await request.formData();

  const command = data.get("command") as string;
  const parsedContext = JSON.parse(
    data.get("context") as string
  ) as ChatCompletionRequestMessage[];

  const response = await getCompletion(command, parsedContext);

  const newContext: ChatCompletionRequestMessage[] = [
    { role: "user", content: command },
    { role: "assistant", content: response },
  ];

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
      formRef.current?.command.focus();
    }
  }, [isPending]);

  return (
    <div className="text-lg p-3">
      <h1 className="text-3xl">
        You are in a Forest <span className="text-green-700">~ Get Out</span>
      </h1>
      <ul>
        {actionData?.context.map((item) =>
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
      <Form method="POST" ref={formRef} className="pt-2">
        <input type="text" name="command" autoFocus disabled={isPending} />
        <input
          type="hidden"
          name="context"
          value={JSON.stringify(actionData?.context ?? [])}
        />
      </Form>
    </div>
  );
}
