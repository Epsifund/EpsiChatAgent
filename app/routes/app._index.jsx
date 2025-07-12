import { Page, Layout, BlockStack } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import Onboarding from "../components/Onboarding";
import { useLoaderData } from "@remix-run/react";
import { TopUnansweredQuestions } from "../components/TopUnansweredQuestions";
import { FaqLogs } from "../components/FaqLogs";
import prisma from "../db.server";

export const loader = async () => {
  const conversations = await prisma.conversation.findMany({
    include: {
      messages: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const logs = conversations.map((conversation) => {
    const sortedMessages = [...conversation.messages].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    );
    const userMessage = sortedMessages.find((msg) => msg.role === "User");
    const assistantMessage = sortedMessages.find(
      (msg) => msg.role === "Assistant",
    );
    const answer = assistantMessage ? assistantMessage.content : null;

    return {
      id: conversation.id,
      question: userMessage ? userMessage.content : null,
      answer: answer,
      answered: answer !== null,
      date: conversation.createdAt,
    };
  });

  return {
    env: {
      THEME_EXTENSION_ID: process.env.THEME_EXTENSION_ID,
      THEME_APP_EXTENSION_NAME: process.env.THEME_APP_EXTENSION_NAME,
    },
    unansweredQuestions: logs.filter((log) => !log.answered),
    logs,
  };
};

export default function Index() {
  const { env, unansweredQuestions, logs } = useLoaderData();

  return (
    <Page fullWidth>
      <TitleBar title="Shop chat agent reference app"></TitleBar>
      <BlockStack gap="500">
        <Onboarding
          THEME_EXTENSION_ID={env.THEME_EXTENSION_ID}
          THEME_APP_EXTENSION_NAME={env.THEME_APP_EXTENSION_NAME}
        />

        <Layout>
          <Layout.Section variant="oneThird">
            <TopUnansweredQuestions unansweredQuestions={unansweredQuestions} />
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <FaqLogs logs={logs} />
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
