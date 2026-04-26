import React, { type ReactNode } from "react";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import styles from "./faq.module.css";

const faqs = [
  {
    question: "What is QDtb?",
    answer: (
      <>
        QDtb is an opinionated configuration for Neovim, PowerShell, and fish.
      </>
    ),
    slug: "what-is-qdtb",
  },
  {
    question: "Is AI used?",
    answer: <>Yes.</>,
    slug: "ai",
  },
  {
    question: "Is this configuration intended for public use?",
    answer: (
      <>
        Not really, and I caution against blindly installing code that has shell
        access like this. When Neovim plugins and PowerShell modules are ready
        for the public they will be published as seperate repositories to
        GitHub.
      </>
    ),
    slug: "public-use",
  },
  {
    question: "How is the documentation generated?",
    answer: (
      <>
        The Lua documentation is automatically extracted from LDoc annotations
        with a local Docusaurus plugin called nvim-docusaurus. This is a custom
        hack and is not useful outside of this repository.
      </>
    ),
    slug: "generated-documentation",
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
  {
    question: "Privacy",
    answer: (
      <ul>
        <li>
          It installs WakaTime. See https://wakatime.com/legal/privacy-policy.
        </li>
        <li>
          It installs GitHub Copilot for Vim and Neovim. See
          https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-privacy.
        </li>
        <li>
          Other plugins (custom and third-party) do not track users or collect
          data.
        </li>
      </ul>
    ),
    slug: "privacy",
  },
  {
    question: "Security",
    answer: (
      <>
        If you notice any security concerns (like if I leaked my credentials) I
        would appreciate it if you emailed me at nate.bass@outlook.com.
      </>
    ),
    slug: "security",
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
