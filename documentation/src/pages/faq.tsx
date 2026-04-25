import React, { type ReactNode } from "react";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import styles from "./faq.module.css";

const faqs = [
  {
    question: "What is QDtb?",
    answer: <>QDtb is a personal developer environment configuration.</>,
  },
  {
    question: "Is AI used.",
    answer: <>Yes.</>,
  },
  {
    question: "How is the documentation generated?",
    answer: (
      <>
        The Neovim API documentation is automatically extracted from LDoc
        annotations within the Lua source files. This ensures that the
        documentation stays in sync with the actual implementation.
      </>
    ),
  },
  {
    question: "Is this configuration intended for public use?",
    answer: (
      <>
        While many parts of the configuration are modular and can be useful to
        others, QDtb is primarily a personal project.
      </>
    ),
  },
  {
    question: "Can I contribute?",
    answer: (
      <>
        Since this is a personal configuration, contributions are generally not
        expected. However, you are welcome to fork the project and adapt it to
        your own needs!
      </>
    ),
  },
];

function FAQCard({
  question,
  answer,
}: {
  question: string;
  answer: ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className={`${styles.faqCard} ${isOpen ? styles.faqCardOpen : ""}`}>
      <button
        className={styles.faqQuestion}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <Heading as="h3">{question}</Heading>
        <span className={styles.faqIcon}>{isOpen ? "−" : "+"}</span>
      </button>
      <div className={styles.faqAnswer}>
        <div className={styles.faqAnswerContent}>{answer}</div>
      </div>
    </div>
  );
}

export default function FAQ(): ReactNode {
  return (
    <Layout title="FAQ" description="Frequently Asked Questions about QDtb">
      <main className={styles.faqContainer}>
        <div className={styles.faqHeader}>
          <Heading as="h1">Frequently Asked Questions</Heading>
          <p>Everything you need to know about the QDtb project.</p>
        </div>
        <div className={styles.faqList}>
          {faqs.map((faq, idx) => (
            <FAQCard key={idx} {...faq} />
          ))}
        </div>
      </main>
    </Layout>
  );
}
