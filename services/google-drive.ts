import { googleDriveService } from "@/lib/google-drive/service";

export interface UploadedFile {
  fileId: string;
  fileName: string;
  url: string | null;
}

export class GoogleDriveUploadError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "GoogleDriveUploadError";
  }
}

/**
 * Thin wrapper over the raw googleDriveService. Translates infra-level
 * exceptions into a domain-level error so callers (services) don't depend
 * on the lib layer.
 */
export const googleDrive = {
  async uploadAppointmentFile(params: {
    folderName: string;
    file: { buffer: Buffer; filename: string };
  }): Promise<UploadedFile> {
    try {
      const result = await googleDriveService.uploadClientDocument({
        clientFolderName: params.folderName,
        document: params.file.buffer,
        documentFilename: params.file.filename,
      });
      return {
        fileId: result.fileId,
        fileName: result.fileName,
        url: result.url,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error desconocido al subir a Drive";
      throw new GoogleDriveUploadError(message, err);
    }
  },
};
