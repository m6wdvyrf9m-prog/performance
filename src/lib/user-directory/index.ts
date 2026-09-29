import { MockUserDirectoryProvider } from "./mock";
import type { UserDirectoryProvider } from "./types";

// TODO: Replace this adapter with InsightsApiUserDirectoryProvider when TCW's
// Insights API contract is available. Group creation should continue to depend
// only on UserDirectoryProvider, not on an Insights-specific client.
export const userDirectoryProvider: UserDirectoryProvider = new MockUserDirectoryProvider();
