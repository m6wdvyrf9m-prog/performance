function firstUsableDatabaseUrl(...values: Array<string | undefined>) {
  return values.find((value) => value?.startsWith("postgresql://") || value?.startsWith("postgres://"));
}

export function getDatabaseUrl() {
  return (
    firstUsableDatabaseUrl(
      process.env.DATABASE_URL,
      process.env.DATABASE_URL_DATABASE_URL,
      process.env.DATABASE_URL_POSTGRES_PRISMA_URL,
      process.env.DATABASE_URL_POSTGRES_URL,
      process.env.DATABASE_URL_POSTGRES_URL_NON_POOLING,
      process.env.POSTGRES_PRISMA_URL,
      process.env.POSTGRES_URL,
      process.env.POSTGRES_URL_NON_POOLING,
    ) ?? "postgresql://postgres:postgres@localhost:5432/team_performance_tcw?schema=public"
  );
}
