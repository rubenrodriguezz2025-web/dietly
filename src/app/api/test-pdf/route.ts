import React from "react";

import { Document, Page, renderToBuffer, Text } from "@react-pdf/renderer";

export async function GET() {
  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4" },
      React.createElement(Text, null, "Dietly PDF Test - OK")
    )
  );

  const buffer = await renderToBuffer(doc as any);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="test.pdf"',
    },
  });
}
