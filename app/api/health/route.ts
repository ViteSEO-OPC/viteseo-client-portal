import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'

export async function GET() {
  const checks: Record<string, { status: 'ok' | 'error'; latency?: number; error?: string }> = {}

  // Check database
  const dbStart = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = { status: 'ok', latency: Date.now() - dbStart }
  } catch (error) {
    checks.database = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  // Check Redis
  const redisStart = Date.now()
  try {
    await redis.ping()
    checks.redis = { status: 'ok', latency: Date.now() - redisStart }
  } catch (error) {
    checks.redis = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  const allHealthy = Object.values(checks).every((c) => c.status === 'ok')

  return Response.json(
    {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  )
}
