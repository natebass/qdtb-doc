import React, { type ReactNode } from "react";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import styles from "./faq.module.css";

const faqs = [
  {
    question: "What is QDtb?",
    answer: <>QDtb is a personal developer environment configuration.</>,
    slug: "what-is-qdtb",
  },
  {
    question: "Is AI used.",
    answer: <>Yes.</>,
    slug: "is-ai-used",
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
    slug: "how-is-the-documentation-generated",
  },
  {
    question: "Is this configuration intended for public use?",
    answer: (
      <>
        While many parts of the configuration are modular and can be useful to
        others, QDtb is primarily a personal project.
      </>
    ),
    slug: "is-this-configuration-intended-for-public-use",
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
    slug: "can-i-contribute",
  },
];

export default function FAQ(): ReactNode {
  return (
    <Layout title="FAQ" description="Frequently Asked Questions about QDtb">
      <main className={styles.faqContainer}>
        <div className={styles.faqHeader}>
          <Heading as="h1">Frequently Asked Questions</Heading>
        </div>
        <div className={styles.faqList}>
          {faqs.map((faq, idx) => (
            <div className={styles.faqCard} key={idx}>
              <h3 id={idx.toString()} className={styles.faqQuestion}>
                {faq.question}
              </h3>
              <div className={styles.faqAnswer}>{faq.answer}</div>
            </div>
          ))}
        </div>
      </main>
    </Layout>
  );
}
