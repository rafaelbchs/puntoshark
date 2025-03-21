"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { PostgrestError } from "@supabase/supabase-js"

// Generic hook for fetching data
export function useFetch<T>(
  table: string,
  query?: {
    column?: string
    value?: any
    limit?: number
    orderBy?: { column: string; ascending?: boolean }
  },
) {
  const [data, setData] = useState<T[] | null>(null)
  const [error, setError] = useState<PostgrestError | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
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

      setData(data as T[])
      setError(error)
      setLoading(false)
    }

    fetchData()
  }, [table, query?.column, query?.value, query?.limit, query?.orderBy])

  return { data, error, loading }
}

// Hook for fetching a single record
export function useFetchOne<T>(table: string, id: string | undefined) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<PostgrestError | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      setLoading(true)
      const { data, error } = await supabase.from(table).select("*").eq("id", id).single()

      setData(data as T)
      setError(error)
      setLoading(false)
    }

    fetchData()
  }, [table, id])

  return { data, error, loading }
}

