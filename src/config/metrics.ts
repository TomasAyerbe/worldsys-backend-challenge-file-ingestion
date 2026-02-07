const roundDecimals = (n: number): number => Math.round(n * 100) / 100;

const toMB = (bytes: number): number => roundDecimals(bytes / 1024 / 1024);

const toSeconds = (ms: number): number => roundDecimals(ms / 1e6);

export function getProcessMetrics() {
  const mem = process.memoryUsage();
  const cpu = process.cpuUsage();

  return {
    memory: {
      rss: toMB(mem.rss),
      heapUsed: toMB(mem.heapUsed),
    },
    cpu: {
      userSeconds: toSeconds(cpu.user),
      systemSeconds: toSeconds(cpu.system),
    },
    uptimeSeconds: roundDecimals(process.uptime()),
  };
}
