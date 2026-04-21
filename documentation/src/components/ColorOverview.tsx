import React from "react";
import Layout from "@theme/Layout";

export default function ColorOverview({ modData }) {
  if (!modData) return null;

  return (
    <Layout title={modData.name} description={modData.summary}>
      <div className="container margin-vert--lg">
        <h1>{modData.name} Colors</h1>
        {modData.summary && <p className="lead">{modData.summary}</p>}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          {/* The color details might be in tags or variables. This is a generic display. If ldoc does not parse tables, we show the raw or a placeholder until refined. */}
          <div
            className="card shadow--md"
            style={{ padding: "20px", textAlign: "center" }}
          >
            <div
              style={{
                backgroundColor: "#2e2e2e",
                width: "100%",
                height: "100px",
                borderRadius: "8px",
              }}
            ></div>
            <div style={{ marginTop: "10px" }}>
              <strong>bg_dim</strong>
              <br />
              <span>#2e2e2e</span>
            </div>
          </div>
          <div
            className="card shadow--md"
            style={{ padding: "20px", textAlign: "center" }}
          >
            <div
              style={{
                backgroundColor: "#c5c5c5",
                width: "100%",
                height: "100px",
                borderRadius: "8px",
              }}
            ></div>
            <div style={{ marginTop: "10px" }}>
              <strong>fg</strong>
              <br />
              <span>#c5c5c5</span>
            </div>
          </div>
          <div
            className="card shadow--md"
            style={{ padding: "20px", textAlign: "center" }}
          >
            <div
              style={{
                backgroundColor: "#3a3a3a",
                width: "100%",
                height: "100px",
                borderRadius: "8px",
              }}
            ></div>
            <div style={{ marginTop: "10px" }}>
              <strong>bg_light</strong>
              <br />
              <span>#3a3a3a</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
