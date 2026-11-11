// The one seam the wedding layer expects from its host app on the client.
// Wedding pages are always noindex, so this only titles and describes them.
export interface SeoInput {
  title: string
  description: string
  titleMode?: 'suffix' | 'exact'
  noindex?: boolean
}

export function useSeo(input: SeoInput): void {
  useSeoMeta({
    title: input.title,
    description: input.description,
    ogTitle: input.title,
    ogDescription: input.description,
    robots: input.noindex === false ? undefined : 'noindex, nofollow',
  })
}
