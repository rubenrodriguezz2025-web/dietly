import React from "react";
import { NextResponse } from "next/server";

import { Document, Page, renderToBuffer,Text } from "@react-pdf/renderer";

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

  const buffer = await renderToBuffer(doc);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="test.pdf"',
    },
  });
}
