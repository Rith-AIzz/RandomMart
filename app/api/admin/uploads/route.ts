import {
  assertSameOrigin,
  ApplicationError,
  toErrorResponse,
} from "../../../../lib/application-error";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { requirePermission } from "../../../../services/authorization.service";

const signatures = [
  { mime: "image/jpeg", ext: "jpg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", ext: "png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/webp", ext: "webp", bytes: [0x52, 0x49, 0x46, 0x46] },
];

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requirePermission("catalog.manage");
    const form = await request.formData();
    const file = form.get("file");
    const productId = String(form.get("productId") ?? "");
    if (!(file instanceof File) || !/^[0-9a-f-]{36}$/i.test(productId))
      throw new ApplicationError("INVALID_UPLOAD", 422);
    if (file.size < 1 || file.size > 5 * 1024 * 1024)
      throw new ApplicationError(
        "INVALID_UPLOAD_SIZE",
        413,
        "Images must be no larger than 5 MB.",
      );
    const bytes = new Uint8Array(await file.arrayBuffer());
    const signature = signatures.find(
      (candidate) =>
        candidate.bytes.every((byte, index) => bytes[index] === byte) &&
        (candidate.mime !== "image/webp" ||
          String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"),
    );
    if (!signature || signature.mime !== file.type)
      throw new ApplicationError(
        "INVALID_FILE_TYPE",
        415,
        "Only genuine JPEG, PNG, and WebP images are accepted.",
      );
    const path = `products/${productId}/${crypto.randomUUID()}.${signature.ext}`;
    const { error } = await createAdminClient()
      .storage.from("product-images")
      .upload(path, bytes, { contentType: signature.mime, upsert: false });
    if (error) throw new ApplicationError("UPLOAD_FAILED", 502, error.message);
    return Response.json({ path }, { status: 201 });
  } catch (cause) {
    return toErrorResponse(cause);
  }
}
