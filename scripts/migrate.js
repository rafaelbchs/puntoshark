import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { config } from "dotenv"

// Load environment variables
config()

// Get directory path
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, "..")

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Get applied migrations
async function getAppliedMigrations() {
  console.log("Fetching applied migrations...")

  try {
    const { data, error } = await supabase.from("_migrations").select("name")

    if (error) {
      if (error.code === "42P01") {
        // Table doesn't exist
        console.log("Migrations table not found. Creating it...")

        // Create migrations table using the execute_sql function
        const { error: createError } = await supabase.rpc("execute_sql", {
          sql: `
            CREATE TABLE IF NOT EXISTS _migrations (
              id SERIAL PRIMARY KEY,
              name TEXT UNIQUE NOT NULL,
              applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
          `,
        })

        if (createError) {
          console.error("Failed to create migrations table:", createError)
          return []
        }

        return []
      }

      console.error("Error fetching migrations:", error)
      return []
    }

    console.log(`Found ${data.length} previously applied migrations`)
    return data.map((m) => m.name)
  } catch (error) {
    console.error("Error fetching applied migrations:", error)
    return []
  }
}

// Apply a migration
async function applyMigration(migrationName, sql) {
  console.log(`Applying migration: ${migrationName}`)

  try {
    // Execute the SQL using the execute_sql function
    const { error: sqlError } = await supabase.rpc("execute_sql", { sql })

    if (sqlError) {
      throw sqlError
    }

    // Record the migration
    const { error: insertError } = await supabase.from("_migrations").insert([{ name: migrationName }])

    if (insertError) throw insertError

    console.log(`Migration applied successfully: ${migrationName}`)
  } catch (error) {
    console.error(`Migration failed: ${migrationName}`, error)
    throw error
  }
}

// Run migrations
async function runMigrations() {
  try {
    console.log("Starting migration process...")
    console.log(`Using Supabase URL: ${supabaseUrl}`)

    const appliedMigrations = await getAppliedMigrations()

    // Get all migration files
    const migrationsDir = path.join(projectRoot, "supabase", "migrations")
    console.log(`Looking for migrations in: ${migrationsDir}`)

    // Check if directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.log(`Migrations directory not found. Creating: ${migrationsDir}`)
      fs.mkdirSync(migrationsDir, { recursive: true })
      console.log("No migrations to apply")
      return
    }

    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort() // Ensure migrations run in order

    console.log(`Found ${migrationFiles.length} total migration files`)

    // Apply pending migrations
    let appliedCount = 0
    for (const file of migrationFiles) {
      if (!appliedMigrations.includes(file)) {
        const filePath = path.join(migrationsDir, file)
        const sql = fs.readFileSync(filePath, "utf8")

        await applyMigration(file, sql)
        appliedCount++
      } else {
        console.log(`Skipping already applied migration: ${file}`)
      }
    }

    console.log(`Migration complete: ${appliedCount} applied, ${migrationFiles.length - appliedCount} skipped`)
  } catch (error) {
    console.error("Migration process failed:", error)
    process.exit(1)
  }
}

// Run migrations
console.log("Starting Supabase migrations...")
runMigrations()
  .then(() => {
    console.log("Migrations completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Migration failed:", error)
    process.exit(1)
  })

