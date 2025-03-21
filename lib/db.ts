// This file will replace any Prisma client usage

import { supabase } from "./supabase"
import type { PostgrestError } from "@supabase/supabase-js"

// Generic type for database operations
type DbResult<T> = {
  data: T | null
  error: PostgrestError | null
}

// Example functions to replace common Prisma operations

// Find a single record
export async function findOne<T>(table: string, id: string): Promise<DbResult<T>> {
  const { data, error } = await supabase.from(table).select("*").eq("id", id).single()

  return { data, error }
}

// Find many records
export async function findMany<T>(
  table: string,
  query?: {
    column?: string
    value?: any
    limit?: number
    orderBy?: { column: string; ascending?: boolean }
  },
): Promise<DbResult<T[]>> {
  let queryBuilder = supabase.from(table).select("*")

  if (query?.column && query?.value !== undefined) {
    queryBuilder = queryBuilder.eq(query.column, query.value)
  }

  if (query?.limit) {
    queryBuilder = queryBuilder.limit(query.limit)
  }

  if (query?.orderBy) {
    queryBuilder = queryBuilder.order(query.orderBy.column, { ascending: query.orderBy.ascending ?? true })
  }

  const { data, error } = await queryBuilder

  return { data: data as T[], error }
}

// Create a record
export async function create<T>(table: string, data: Partial<T>): Promise<DbResult<T>> {
  const { data: createdData, error } = await supabase.from(table).insert(data).select().single()

  return { data: createdData as T, error }
}

// Update a record
export async function update<T>(table: string, id: string, data: Partial<T>): Promise<DbResult<T>> {
  const { data: updatedData, error } = await supabase.from(table).update(data).eq("id", id).select().single()

  return { data: updatedData as T, error }
}

// Delete a record
export async function remove(table: string, id: string): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase.from(table).delete().eq("id", id)

  return { error }
}

