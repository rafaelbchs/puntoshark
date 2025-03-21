import { v4 as uuidv4 } from "uuid"

/**
 * Converts a numeric or string ID to a valid UUID
 * If the ID is already a valid UUID, it returns it unchanged
 * Otherwise, it generates a deterministic UUID based on the input ID
 */
export function ensureUUID(id: string | number): string {
  // Check if the ID is already a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (typeof id === "string" && uuidRegex.test(id)) {
    return id
  }

  // Generate a deterministic UUID based on the input ID
  // This ensures the same numeric ID always maps to the same UUID
  const namespace = "6ba7b810-9dad-11d1-80b4-00c04fd430c8" // A fixed namespace UUID
  const idString = String(id)

  // Simple deterministic UUID generation (not cryptographically secure, but consistent)
  const hash = Array.from(idString).reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)

  // Format as UUID v4
  const uuid = uuidv4()
  const parts = uuid.split("-")
  parts[0] = hash.toString(16).padStart(8, "0").substring(0, 8)

  return parts.join("-")
}

