/**
 * Phase 10: IPFS Controller
 *
 * Handles /api/ipfs/upload and /api/ipfs/:cid.
 * Requires authenticated wallet session. Rejects unencrypted plaintext.
 */

import { Request, Response, NextFunction } from "express";
import { ipfsService } from "../services/ipfs.service";
import { AppError } from "../middleware/error-handler";

export async function handleUpload(req: Request, res: Response, next: NextFunction) {
  try {
    let rawBytes: Uint8Array | null = null;
    let fileName: string | undefined;

    if (Buffer.isBuffer(req.body)) {
      rawBytes = new Uint8Array(req.body);
      fileName = (req.query.filename as string) || (req.headers["x-filename"] as string);
    } else if (req.body && typeof req.body === "object") {
      if (req.body.payload && typeof req.body.payload === "string") {
        // Base64 encoded payload
        const buf = Buffer.from(req.body.payload, "base64");
        rawBytes = new Uint8Array(buf);
        fileName = req.body.fileName;
      } else if (req.body instanceof Uint8Array) {
        rawBytes = req.body;
      }
    }

    if (!rawBytes || rawBytes.length === 0) {
      throw new AppError(
        "Missing encrypted payload. Send binary body (application/octet-stream) or JSON with base64 payload.",
        400,
        "MISSING_PAYLOAD",
        "IPFS"
      );
    }

    const uploadResult = await ipfsService.uploadPayload(rawBytes, fileName);

    res.status(200).json({
      cid: uploadResult.cid,
      size: uploadResult.size,
      pinnedAt: uploadResult.timestamp,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleDownload(req: Request, res: Response, next: NextFunction) {
  try {
    const cid = req.params.cid;
    if (!cid) {
      throw new AppError("Missing IPFS CID parameter.", 400, "MISSING_CID", "IPFS");
    }

    const downloadResult = await ipfsService.downloadPayload(cid);

    const acceptHeader = req.headers.accept || "";
    if (acceptHeader.includes("application/json") || req.query.format === "json") {
      return res.status(200).json({
        cid: downloadResult.cid,
        size: downloadResult.rawBytes.length,
        payloadBase64: Buffer.from(downloadResult.rawBytes).toString("base64"),
      });
    }

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${cid}.bin"`);
    res.setHeader("Content-Length", downloadResult.rawBytes.length.toString());
    res.status(200).send(Buffer.from(downloadResult.rawBytes));
  } catch (err) {
    next(err);
  }
}
