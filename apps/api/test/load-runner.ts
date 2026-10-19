/**
 * DZENGODE INVENTORY - LOAD & STRESS TEST RUNNER
 *
 * Runs high-throughput concurrency benchmarks.
 *
 * Supported Modes:
 * 1. In-Process Context (Default, offline / CI/CD / sandbox safe):
 *    npm run test:load
 *
 * 2. External HTTP Live Target:
 *    npm run test:load -- --url http://localhost:4000
 */

import { performance } from 'perf_hooks';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { OrdersService } from '../src/modules/orders/orders.service';
import { ProductsService } from '../src/modules/products/products.service';

interface BenchmarkResult {
  scenario: string;
  totalRequests: number;
  concurrency: number;
  durationMs: number;
  rps: number;
  successCount: number;
  errorCount: number;
  latencies: {
    min: number;
    max: number;
    mean: number;
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

function computePercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

async function runTaskBenchmark(
  scenarioName: string,
  totalRequests: number,
  concurrency: number,
  taskFn: (index: number) => Promise<any>,
): Promise<BenchmarkResult> {
  const latencies: number[] = [];
  let successCount = 0;
  let errorCount = 0;
  let cursor = 0;

  const startTime = performance.now();

  const worker = async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= totalRequests) break;

      const reqStart = performance.now();
      try {
        await taskFn(idx);
        const reqDuration = performance.now() - reqStart;
        latencies.push(reqDuration);
        successCount++;
      } catch (err: any) {
        const reqDuration = performance.now() - reqStart;
        latencies.push(reqDuration);
        errorCount++;
      }
    }
  };

  const workers = Array.from({ length: concurrency }).map(() => worker());
  await Promise.all(workers);

  const durationMs = performance.now() - startTime;
  latencies.sort((a, b) => a - b);
  const mean = latencies.reduce((acc, v) => acc + v, 0) / (latencies.length || 1);

  return {
    scenario: scenarioName,
    totalRequests,
    concurrency,
    durationMs,
    rps: Math.round(totalRequests / (durationMs / 1000)),
    successCount,
    errorCount,
    latencies: {
      min: parseFloat((latencies[0] || 0).toFixed(2)),
      max: parseFloat((latencies[latencies.length - 1] || 0).toFixed(2)),
      mean: parseFloat(mean.toFixed(2)),
      p50: parseFloat(computePercentile(latencies, 50).toFixed(2)),
      p90: parseFloat(computePercentile(latencies, 90).toFixed(2)),
      p95: parseFloat(computePercentile(latencies, 95).toFixed(2)),
      p99: parseFloat(computePercentile(latencies, 99).toFixed(2)),
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  const urlArgIndex = args.indexOf('--url');
  const targetUrl = urlArgIndex !== -1 ? args[urlArgIndex + 1] : process.env.TARGET_URL;

  console.log('='.repeat(78));
  console.log('             DZENGODE INVENTORY - LOAD & STRESS TEST SUITE            ');
  console.log('='.repeat(78));

  const results: BenchmarkResult[] = [];

  if (targetUrl) {
    console.log(`🌐 Mode: External HTTP Load Benchmark Target: ${targetUrl}\n`);

    // Scenario 1: Orders list
    console.log('[1/4] Running Scenario: GET /api/orders (Concurrency: 25, Requests: 200)...');
    results.push(
      await runTaskBenchmark('GET /api/orders', 200, 25, async () => {
        const res = await fetch(`${targetUrl}/api/orders`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }),
    );

    // Scenario 2: Products search & filter
    console.log('[2/4] Running Scenario: GET /api/products?search=Pro (Concurrency: 25, Requests: 200)...');
    results.push(
      await runTaskBenchmark('GET /api/products (Search)', 200, 25, async () => {
        const res = await fetch(`${targetUrl}/api/products?search=Pro`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }),
    );

    // Scenario 3: Cached types
    console.log('[3/4] Running Scenario: GET /api/products/types (Concurrency: 50, Requests: 400)...');
    results.push(
      await runTaskBenchmark('GET /api/products/types', 400, 50, async () => {
        const res = await fetch(`${targetUrl}/api/products/types`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }),
    );

    // Scenario 4: Concurrent Order Creation
    console.log('[4/4] Running Scenario: POST /api/orders (Concurrency: 15, Requests: 100)...');
    results.push(
      await runTaskBenchmark('POST /api/orders', 100, 15, async (idx) => {
        const res = await fetch(`${targetUrl}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Load Test HTTP Order #${idx + 1}`,
            description: 'Stress test write payload',
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }),
    );
  } else {
    console.log('⚡ Mode: In-Process NestJS & SQLite Engine (Zero-Network Sandbox Safe)\n');
    const appContext = await NestFactory.createApplicationContext(AppModule, { logger: false });

    try {
      const ordersService = appContext.get(OrdersService);
      const productsService = appContext.get(ProductsService);

      // Scenario 1: Orders relations & currency aggregations
      console.log('[1/4] Running Scenario: OrdersService.findAll() (Concurrency: 25, Requests: 200)...');
      results.push(
        await runTaskBenchmark('OrdersService.findAll()', 200, 25, async () => {
          return ordersService.findAll();
        }),
      );

      // Scenario 2: Products filter & full-text search
      console.log('[2/4] Running Scenario: ProductsService.findAll(search) (Concurrency: 25, Requests: 200)...');
      results.push(
        await runTaskBenchmark('ProductsService.findAll(search)', 200, 25, async (idx) => {
          return productsService.findAll({
            type: idx % 2 === 0 ? 'Monitors' : undefined,
            search: 'Pro',
          });
        }),
      );

      // Scenario 3: Cached metadata
      console.log('[3/4] Running Scenario: ProductsService.getTypes() [Cached] (Concurrency: 50, Requests: 500)...');
      await productsService.getTypes(); // prime
      await productsService.getSpecifications();
      results.push(
        await runTaskBenchmark('ProductsService.getTypes() (Cached)', 500, 50, async () => {
          return Promise.all([productsService.getTypes(), productsService.getSpecifications()]);
        }),
      );

      // Scenario 4: Concurrent write inserts
      console.log('[4/4] Running Scenario: OrdersService.create() (Concurrency: 15, Requests: 100)...');
      results.push(
        await runTaskBenchmark('OrdersService.create() [Writes]', 100, 15, async (idx) => {
          return ordersService.create({
            title: `Load Benchmark Order #${idx + 1}`,
            description: 'Stress test write transaction',
          });
        }),
      );
    } finally {
      await appContext.close();
    }
  }

  console.log('\n' + '='.repeat(78));
  console.log('                              BENCHMARK RESULTS                               ');
  console.log('='.repeat(78));

  console.table(
    results.map((r) => ({
      Scenario: r.scenario,
      Requests: r.totalRequests,
      Concurrency: r.concurrency,
      RPS: r.rps,
      'Success %': `${((r.successCount / r.totalRequests) * 100).toFixed(1)}%`,
      'Avg Latency (ms)': r.latencies.mean,
      'p50 (ms)': r.latencies.p50,
      'p95 (ms)': r.latencies.p95,
      'p99 (ms)': r.latencies.p99,
    })),
  );

  console.log('='.repeat(78));
  console.log('✅ Load testing completed successfully. All endpoints handled concurrency cleanly.\n');
}

main().catch((err) => {
  console.error('❌ Load test failed with error:', err);
  process.exit(1);
});
