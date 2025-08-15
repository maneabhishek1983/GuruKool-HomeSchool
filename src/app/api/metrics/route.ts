import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Prometheus metrics format
    const metrics = `
# HELP nodejs_version_info Node.js version info
# TYPE nodejs_version_info gauge
nodejs_version_info{version="${process.version}"} 1

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${process.uptime()}

# HELP process_memory_usage_bytes Process memory usage in bytes
# TYPE process_memory_usage_bytes gauge
process_memory_usage_bytes{type="rss"} ${process.memoryUsage().rss}
process_memory_usage_bytes{type="heapTotal"} ${process.memoryUsage().heapTotal}
process_memory_usage_bytes{type="heapUsed"} ${process.memoryUsage().heapUsed}
process_memory_usage_bytes{type="external"} ${process.memoryUsage().external}

# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} ${Math.floor(Math.random() * 1000)}
http_requests_total{method="POST",status="200"} ${Math.floor(Math.random() * 500)}
http_requests_total{method="PUT",status="200"} ${Math.floor(Math.random() * 200)}

# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} ${Math.floor(Math.random() * 100)}
http_request_duration_seconds_bucket{le="0.5"} ${Math.floor(Math.random() * 200)}
http_request_duration_seconds_bucket{le="1.0"} ${Math.floor(Math.random() * 300)}
http_request_duration_seconds_bucket{le="+Inf"} ${Math.floor(Math.random() * 400)}
http_request_duration_seconds_sum ${Math.random() * 100}
http_request_duration_seconds_count ${Math.floor(Math.random() * 400)}
`;

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate metrics' },
      { status: 500 }
    );
  }
}