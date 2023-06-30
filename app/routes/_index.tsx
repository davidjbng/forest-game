import type { ActionArgs, V2_MetaFunction } from "@remix-run/node";
import { Form, useNavigation } from "@remix-run/react";
import { useEffect, useRef } from 'react';

export const meta: V2_MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export async function action({ request }: ActionArgs) {
  const data = await request.formData();
  console.log(data.get("command"));

  return null;
}

export default function Index() {
  const navigation = useNavigation()
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (navigation.state === "submitting") {
      formRef.current?.reset()
    }
  }, [navigation.state])

  return (
    <div className="text-lg p-3">
      <h1 className="text-3xl">
        You are in a Forest <span className="text-green-700">~ Get Out</span>
      </h1>
      <Form method="POST" ref={formRef}>
        <input type="text" name="command" />
        <button>Submit</button>
      </Form>
    </div>
  );
}
