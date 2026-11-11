// The wedding layer registers its API as public with the host app's session
// gate. This app has no sessions, so there is nothing to register with.
export function registerPublicApiRoutes(_routes: readonly { path: string; match?: string }[]): void {}
