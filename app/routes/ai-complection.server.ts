import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";

const apiKey = process.env.API_KEY;

function getConfig(model: string) {
  return new Configuration({
    apiKey,
    basePath: `https://lise-openai-gpt4.openai.azure.com/openai/deployments/${model}`,
    baseOptions: {
      headers: {
        "api-key": apiKey,
      },
      params: {
        "api-version": "2023-03-15-preview",
      },
    },
  });
}

const model = new OpenAIApi(getConfig("gpt4"));

export async function getCompletion(
  query: string,
  context: ChatCompletionRequestMessage[] = []
): Promise<string> {
  const completion = await model.createChatCompletion({
    model: "gpt-35-turbo",
    messages: [
      {
        role: "system",
        content: `You are a text based game. 
          Where the user tries to escape the forest.
          The user will give you instructions what to do,
          you will answer with a description of the new surrounding.

          Example:
          You: 'You wake up in a forest.'
          User: 'Climb a tree.'
          You: 'You climb a tree. More forest'
          User: 'Look around.'
          You: 'You look around. You see more forest.'
          User: 'Head north'
          You: 'You head north. After a thirty minute walk there is a clearing.'

          If the user has escaped the forest the game ends. Include a Congratulations message in that case.
          If the user cannot escape within 10 messages the game is lost. 

          Start Game:
          `,
      },
      ...context,
      {
        role: "user",
        content: query,
      },
    ],
  });

  return completion.data.choices[0].message?.content ?? "";
}
