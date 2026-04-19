import { put } from "@vercel/blob";

export class ResultBlobUnavailableError extends Error {
  constructor(message = "BLOB_READ_WRITE_TOKEN fehlt — PDF-Upload nicht möglich.") {
    super(message);
    this.name = "ResultBlobUnavailableError";
  }
}

export async function uploadResultSchematicPdf(resultId: string, pdf: Buffer): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    throw new ResultBlobUnavailableError();
  }
  const pathname = `results/${resultId}/schematic-${Date.now()}.pdf`;
  const res = await put(pathname, pdf, {
    access: "public",
    contentType: "application/pdf",
    addRandomSuffix: true,
  });
  return res.url;
}
