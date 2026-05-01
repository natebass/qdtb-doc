import React, { type ReactNode } from "react";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import styles from "./faq.module.css";

const faqs = [
  {
    question: "What is QDtb?",
    answer: (
      <>
        This is my opinionated configuration for Neovim, PowerShell, and fish.
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
    question: "Is this intended for public use?",
    answer: (
      <>
        <b>Not really, and I caution against blindly installing code that has shell
        access like this.</b> When Neovim plugins and PowerShell modules are ready
        for the public they will be published as seperate repositories to
        GitHub.
      </>
    ),
    slug: "public-use",
  },
  {
    question: "How is the Lua documentation generated?",
    answer: (
      <>
        LDoc annotations are parsed with a local Docusaurus plugin called nvim-docusaurus. This is a custom
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
          Other plugins do not track users or collect data. But I can only speak for mine, see
        </li>
      </ul>
    ),
    slug: "privacy",
  },
  {
    question: "Security",
    answer: (
      <>
        If you notice a security concern, I would appreciate it if you emailed me at nate.bass@outlook.com.
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
