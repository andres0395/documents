import { google } from "googleapis";
import { Readable } from "node:stream";

type GoogleDriveConfig = {
  parentFolderId: string;
  authMode: "oauth" | "service_account";
  oauth?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    refreshToken: string;
  };
  serviceAccount?: {
    serviceAccountEmail: string;
    privateKey: string;
    impersonateUserEmail?: string;
  };
};

type UploadClientDocumentParams = {
  clientFolderName: string;
  document: Buffer;
  documentFilename: string;
};

type UploadClientDocumentResult = {
  parentFolderId: string;
  clientFolderId: string;
  fileId: string;
  fileName: string;
  url: string | null;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function getGoogleDriveConfig(): GoogleDriveConfig {
  const refreshToken = process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN;
  if (refreshToken) {
    return {
      authMode: "oauth",
      parentFolderId: getRequiredEnv("GOOGLE_DRIVE_PARENT_FOLDER_ID"),
      oauth: {
        clientId: getRequiredEnv("GOOGLE_DRIVE_OAUTH_CLIENT_ID"),
        clientSecret: getRequiredEnv("GOOGLE_DRIVE_OAUTH_CLIENT_SECRET"),
        redirectUri: process.env.GOOGLE_DRIVE_OAUTH_REDIRECT_URI || "http://localhost",
        refreshToken,
      },
    };
  }

  return {
    authMode: "service_account",
    parentFolderId: getRequiredEnv("GOOGLE_DRIVE_PARENT_FOLDER_ID"),
    serviceAccount: {
      serviceAccountEmail: getRequiredEnv("GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL"),
      privateKey: getRequiredEnv("GOOGLE_DRIVE_PRIVATE_KEY").replace(/\\n/g, "\n"),
      impersonateUserEmail: process.env.GOOGLE_DRIVE_IMPERSONATE_USER_EMAIL || undefined,
    },
  };
}

function sanitizeFolderName(value: string): string {
  return value
    .trim()
    .replace(/[\\/]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 150);
}

function toDriveQueryStringLiteral(value: string): string {
  return value.replace(/'/g, "\\'");
}

function guessMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return "application/octet-stream";

  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";

  return "application/octet-stream";
}

let cachedDrive:
  | ReturnType<typeof google.drive>
  | null = null;

function normalizeGoogleAuthError(error: unknown): Error {
  if (error && typeof error === "object") {
    const anyErr = error as {
      message?: unknown;
      response?: { data?: { error?: unknown; error_description?: unknown } };
    };

    const apiError = anyErr.response?.data?.error;
    const apiErrorDescription = anyErr.response?.data?.error_description;
    if (typeof apiError === "string") {
      const description = typeof apiErrorDescription === "string" ? apiErrorDescription : undefined;
      const suffix = description ? ` (${description})` : "";
      return new Error(
        `Google Drive OAuth error: ${apiError}${suffix}. Verify GOOGLE_DRIVE_OAUTH_CLIENT_ID/SECRET and regenerate GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN with those credentials.`,
      );
    }

    if (typeof anyErr.message === "string") return new Error(anyErr.message);
  }

  return new Error("Google Drive OAuth error");
}

async function getDriveClient() {
  if (cachedDrive) return cachedDrive;

  const config = getGoogleDriveConfig();
  const scopes = ["https://www.googleapis.com/auth/drive"];
  if (config.authMode === "oauth") {
    const auth = new google.auth.OAuth2({
      clientId: config.oauth?.clientId,
      clientSecret: config.oauth?.clientSecret,
      redirectUri: config.oauth?.redirectUri,
    });
    auth.setCredentials({ refresh_token: config.oauth?.refreshToken });
    try {
      await auth.getAccessToken();
    } catch (error) {
      throw normalizeGoogleAuthError(error);
    }
    cachedDrive = google.drive({ version: "v3", auth });
    return cachedDrive;
  }

  const auth = new google.auth.JWT({
    email: config.serviceAccount?.serviceAccountEmail,
    key: config.serviceAccount?.privateKey,
    scopes,
    subject: config.serviceAccount?.impersonateUserEmail,
  });

  await auth.authorize();
  cachedDrive = google.drive({ version: "v3", auth });
  return cachedDrive;
}

async function ensureClientFolderId(params: { parentFolderId: string; folderName: string }): Promise<string> {
  const drive = await getDriveClient();
  const folderName = sanitizeFolderName(params.folderName);
  const nameLiteral = toDriveQueryStringLiteral(folderName);
  const parentLiteral = toDriveQueryStringLiteral(params.parentFolderId);

  const query = [
    `mimeType='application/vnd.google-apps.folder'`,
    `name='${nameLiteral}'`,
    `'${parentLiteral}' in parents`,
    `trashed=false`,
  ].join(" and ");

  const existing = await drive.files.list({
    q: query,
    pageSize: 1,
    fields: "files(id,name)",
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  const existingId = existing.data.files?.[0]?.id;
  if (existingId) return existingId;

  const created = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [params.parentFolderId],
    },
    fields: "id",
    supportsAllDrives: true,
  });

  const createdId = created.data.id;
  if (!createdId) throw new Error("Google Drive folder creation failed");

  return createdId;
}

export const googleDriveService = {
  uploadClientDocument: async (params: UploadClientDocumentParams): Promise<UploadClientDocumentResult> => {
    const drive = await getDriveClient();
    const config = getGoogleDriveConfig();
    const clientFolderId = await ensureClientFolderId({
      parentFolderId: config.parentFolderId,
      folderName: params.clientFolderName,
    });

    const mimeType = guessMimeType(params.documentFilename);

    const created = await drive.files.create({
      requestBody: {
        name: params.documentFilename,
        parents: [clientFolderId],
      },
      media: {
        mimeType,
        body: Readable.from(params.document),
      },
      fields: "id,name,webViewLink",
      supportsAllDrives: true,
    });

    const fileId = created.data.id;
    const fileName = created.data.name || params.documentFilename;
    if (!fileId) throw new Error("Google Drive upload failed");

    return {
      parentFolderId: config.parentFolderId,
      clientFolderId,
      fileId,
      fileName,
      url: created.data.webViewLink ?? null,
    };
  },
};
