import type { WeddingConfig } from '../shared/utils/wedding-types'
import { mayatheo } from './mayatheo'

// Every wedding this deployment serves, keyed by slug. A repo that vendors the
// engine keeps its own copy of this directory; README.md › Vendoring.
export const weddings: Record<string, WeddingConfig> = {
  [mayatheo.slug]: mayatheo,
}
