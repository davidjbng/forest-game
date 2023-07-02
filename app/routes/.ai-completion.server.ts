import OpenAI from "openai";

export type ChatCompletionMesssage =
  OpenAI.Chat.Completions.CompletionCreateParams.CreateChatCompletionRequestNonStreaming.Message;

export async function getCompletion(
  query: string,
  context: ChatCompletionMesssage[] = []
): Promise<GetCompletion> {
  try {
    const model = new OpenAI();
    const completion = await model.chat.completions.create({
      model: "gpt-3.5-turbo-0613",
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

          Make it hard for the user, there is no easy escape path by just walking out or destroying the forest.
          Even how hard the user tries, there is no way escaping without really figuring the right instructions.
          The user has to be creative to get out.
          Don't let the user invent the rules.
          The user cannot invent situations outside of his control.
          The user cannot decide what happens outside of his control.
          You invent what the user sees or what happens after the user actions have been done.
          Don't apologize if the action cannot be performed.

          Sometimes random tools appear that can be used to find a way out.
          Other People or Creatures can appear to amuse the user.

          If the user makes stupid request, nit him for doing it.
          If the user does not make progress, nit him in funny ways.

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

    const response = completion.choices[0]?.message?.content;
    return response ? { success: true, message: response } : { success: false };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
}

type GetCompletion = { success: true; message: string } | { success: false };
