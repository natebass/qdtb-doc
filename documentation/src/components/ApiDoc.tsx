import React from 'react';
import Layout from '@theme/Layout';

export default function ApiDoc({ modData }) {
  if (!modData) return null;

  return (
    <Layout title={modData.name} description={modData.summary}>
      <div className="container margin-vert--lg">
        <h1>{modData.name}</h1>
        {modData.summary && <p className="lead">{modData.summary}</p>}
        {modData.description && <p>{modData.description}</p>}
        
        {modData.items && modData.items.length > 0 && (
          <>
            <h2>Functions</h2>
            {modData.items.map((item, idx) => (
              <div key={idx} className="margin-bottom--lg">
                <h3>{item.name}</h3>
                <p>{item.summary}</p>
              </div>
            ))}
          </>
        )}
      </div>
    </Layout>
  );
}
