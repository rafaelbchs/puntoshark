import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"
import { config } from "dotenv"
import readline from "readline"

// Load environment variables
config()

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

async function createAdmin() {
  return new Promise((resolve) => {
    rl.question("Enter admin username: ", (username) => {
      rl.question("Enter admin password: ", async (password) => {
        rl.question("Enter admin name (optional): ", (name) => {
          rl.question("Enter admin email (optional): ", async (email) => {
            try {
              // Check if admin already exists
              const { data: existingAdmin, error: checkError } = await supabase
                .from("admins")
                .select("id")
                .eq("username", username)
                .single()

              if (checkError && checkError.code !== "PGRST116") throw checkError

              if (existingAdmin) {
                console.log(`Admin with username "${username}" already exists.`)
                resolve()
                return
              }

              // Hash password
              const passwordHash = await bcrypt.hash(password, 10)

              // Create admin
              const { data, error } = await supabase
                .from("admins")
                .insert([
                  {
                    username,
                    password_hash: passwordHash,
                    name: name || null,
                    email: email || null,
                    role: "admin",
                  },
                ])
                .select("id, username, role")
                .single()

              if (error) throw error

              console.log(`Admin created successfully: ${data.username} (${data.role})`)
              resolve()
            } catch (error) {
              console.error("Error creating admin:", error)
              resolve()
            }
          })
        })
      })
    })
  })
}

// Run the function
createAdmin().then(() => {
  rl.close()
  process.exit(0)
})

