import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';
import Translate from '@docusaurus/Translate';
import type {Props} from '@theme/NotFound/Content';
import styles from '../styles.module.css';

export default function NotFoundContent({className}: Props): ReactNode {
  const location = useLocation();
  
  return (
    <main className={clsx(styles.container, className)}>
      <div className={styles.glow} />
      
      <h1 className={styles.errorCode}>404</h1>
      
      <h2 className={styles.title}>
        <Translate id="theme.NotFound.title">Page Not Found</Translate>
      </h2>
      
      <p className={styles.description}>
        <Translate id="theme.NotFound.p1">
          The requested module or resource could not be found in the current environment.
        </Translate>
      </p>

      <div className={styles.terminal}>
        <div className={styles.terminalLine}>
          <span className={styles.prompt}>$</span>
          <span>nvim --cmd "edit {location.pathname}"</span>
        </div>
        <div className={styles.terminalLine}>
          <span className={styles.errorText}>
            E484: Can't open file "{location.pathname}"
          </span>
        </div>
        <div className={styles.terminalLine}>
          <span className={styles.errorText}>
            [E] Error: Path not found in documentation manifest.
          </span>
        </div>
      </div>

      <div className={styles.buttonGroup}>
        <Link to="/" className={clsx(styles.button, styles.primaryButton)}>
          Go Back Home
        </Link>
        <Link to="/docs" className={clsx(styles.button, styles.secondaryButton)}>
          View Documentation
        </Link>
      </div>
    </main>
  );
}

