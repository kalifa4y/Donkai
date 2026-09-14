// Ambient type declarations for Supabase Edge Functions (Deno runtime)
// This file eliminates IDE / TypeScript linter warnings for Deno globals and ESM URL imports

declare const Deno: {
  env: {
    get(key: string): string | undefined
    set(key: string, value: string): void
  }
  serve(handler: (req: Request) => Promise<Response> | Response): void
}

declare module 'https://*' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any
  export default content
  export * from 'https://*'
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export * from '@supabase/supabase-js'
}
