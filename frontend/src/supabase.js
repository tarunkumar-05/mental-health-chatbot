import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nluvbakzetjowdrbrkix.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sdXZiYWt6ZXRqb3dkcmJya2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMDkyMjIsImV4cCI6MjA4ODg4NTIyMn0.IT5faWY9-TTQGPng_jGVeJKsnIj5UZp22PXduwgBATs'

export const supabase = createClient(supabaseUrl, supabaseKey)