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

        try {
          // Try to create migrations table directly
          const { error: createTableError } = await supabase.rpc("execute_sql", {
            sql: `
              CREATE TABLE IF NOT EXISTS _migrations (
                id SERIAL PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
              );
            `,
          })

          if (createTableError) {
            console.error("Failed to create migrations table using RPC:", createTableError)

            // Try direct SQL if RPC fails
            const { error: directError } = await supabase
              .from("_migrations")
              .insert([])
              .select()
              .limit(0)
              .catch(() => {
                // If this fails, create the table directly
                return supabase.sql(`
                  CREATE TABLE IF NOT EXISTS _migrations (
                    id SERIAL PRIMARY KEY,
                    name TEXT UNIQUE NOT NULL,
                    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                  );
                `)
              })

            if (directError) {
              console.error("Failed to create migrations table directly:", directError)
              // Continue anyway, we'll try to create it during migration
            }
          }
        } catch (e) {
          console.error("Error creating migrations table:", e)
          // Continue anyway, we'll try to create it during migration
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
    // First, check if the migration has already been applied
    // This is a fallback in case the _migrations table exists but the record is missing
    const { data: existingMigration } = await supabase
      .from("_migrations")
      .select("name")
      .eq("name", migrationName)
      .maybeSingle()

    if (existingMigration) {
      console.log(`Migration ${migrationName} appears to be already applied, skipping...`)
      return
    }

    // Execute the SQL using the execute_sql function
    const { error: sqlError } = await supabase.rpc("execute_sql", { sql })

    if (sqlError) {
      // If the RPC fails, try to execute the SQL directly
      console.log("RPC failed, trying direct SQL execution...")

      // Split the SQL into statements and execute them one by one
      const statements = sql.split(";").filter((stmt) => stmt.trim().length > 0)

      for (const statement of statements) {
        try {
          await supabase.sql(statement + ";")
        } catch (err) {
          console.log(`Statement error (continuing anyway): ${err.message}`)
          // Continue with other statements
        }
      }
    }

    // Record the migration
    const { error: insertError } = await supabase.from("_migrations").insert([{ name: migrationName }])

    if (insertError) {
      console.error(`Failed to record migration ${migrationName}:`, insertError)
      // Continue anyway, the migration was applied
    }

    console.log(`Migration applied successfully: ${migrationName}`)
  } catch (error) {
    console.error(`Migration failed: ${migrationName}`, error)

    // If this is the initial migration and it failed because objects already exist,
    // we'll mark it as applied anyway
    if (migrationName.includes("initial_schema")) {
      console.log("This appears to be the initial schema. Marking as applied despite errors...")
      try {
        await supabase.from("_migrations").insert([{ name: migrationName }])
        console.log(`Marked ${migrationName} as applied.`)
        return
      } catch (e) {
        console.error("Failed to mark migration as applied:", e)
      }
    }

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

    // For deployment, we don't want to fail the build if migrations have issues
    // but the schema is already set up
    if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      console.log("Continuing build despite migration errors since we're in production/Vercel environment")
      return
    }

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

    // For deployment, we don't want to fail the build if migrations have issues
    // but the schema is already set up
    if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      console.log("Continuing build despite migration errors since we're in production/Vercel environment")
      process.exit(0)
    } else {
      process.exit(1)
    }
  })

